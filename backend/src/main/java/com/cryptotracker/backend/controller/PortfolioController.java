package com.cryptotracker.backend.controller;

import com.cryptotracker.backend.dto.PortfolioEntryDto;
import com.cryptotracker.backend.dto.PortfolioRequest;
import com.cryptotracker.backend.entity.Coin;
import com.cryptotracker.backend.entity.CoinPrice;
import com.cryptotracker.backend.entity.PortfolioEntry;
import com.cryptotracker.backend.entity.PortfolioSnapshot;
import com.cryptotracker.backend.entity.User;
import com.cryptotracker.backend.repository.CoinRepository;
import com.cryptotracker.backend.repository.PortfolioRepository;
import com.cryptotracker.backend.repository.PortfolioSnapshotRepository;
import com.cryptotracker.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    private final PortfolioRepository portfolioRepository;
    private final UserRepository userRepository;
    private final CoinRepository coinRepository;
    private final PortfolioSnapshotRepository snapshotRepository;

    public PortfolioController(PortfolioRepository portfolioRepository,
                               UserRepository userRepository,
                               CoinRepository coinRepository,
                               PortfolioSnapshotRepository snapshotRepository) {
        this.portfolioRepository = portfolioRepository;
        this.userRepository = userRepository;
        this.coinRepository = coinRepository;
        this.snapshotRepository = snapshotRepository;
    }

    private User getUser(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername())
            .orElseThrow(() -> new IllegalStateException("Kullanıcı bulunamadı"));
    }

    @GetMapping
    public List<PortfolioEntryDto> getPortfolio(@AuthenticationPrincipal UserDetails principal) {
        User user = getUser(principal);
        return portfolioRepository.findByUser(user).stream()
            .map(this::toDto)
            .toList();
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> upsert(@RequestBody PortfolioRequest req,
                                    @AuthenticationPrincipal UserDetails principal) {
        User user = getUser(principal);
        Coin coin = coinRepository.findById(req.coinId())
            .orElseThrow(() -> new IllegalArgumentException("Coin bulunamadı: " + req.coinId()));

        PortfolioEntry entry = portfolioRepository
            .findByUserAndCoinId(user, req.coinId())
            .orElseGet(() -> {
                PortfolioEntry e = new PortfolioEntry();
                e.setUser(user);
                e.setCoin(coin);
                return e;
            });

        entry.setQuantity(req.quantity());
        entry.setBuyPrice(req.buyPrice());
        entry.setUpdatedAt(LocalDateTime.now());
        portfolioRepository.save(entry);
        return ResponseEntity.ok(toDto(entry));
    }

    @DeleteMapping("/{coinId}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable String coinId,
                                    @AuthenticationPrincipal UserDetails principal) {
        User user = getUser(principal);
        portfolioRepository.deleteByUserAndCoinId(user, coinId);
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@AuthenticationPrincipal UserDetails principal) {
        User user = getUser(principal);
        return ResponseEntity.ok(snapshotRepository.findByUserOrderByRecordedAtAsc(user)
            .stream()
            .map(s -> Map.of("date", s.getRecordedAt().toString(), "value", s.getTotalValue()))
            .toList());
    }

    public void takeSnapshot(User user) {
        List<PortfolioEntry> entries = portfolioRepository.findByUser(user);
        if (entries.isEmpty()) return;
        // Son 24 saatte zaten snapshot alındıysa tekrar alma
        long recentCount = snapshotRepository.countByUserSince(user, LocalDateTime.now().minusHours(23));
        if (recentCount > 0) return;

        BigDecimal total = entries.stream()
            .map(e -> {
                CoinPrice price = e.getCoin().getPrice();
                BigDecimal p = price != null ? price.getPriceUsd() : BigDecimal.ZERO;
                return e.getQuantity().multiply(p);
            })
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        PortfolioSnapshot snapshot = new PortfolioSnapshot();
        snapshot.setUser(user);
        snapshot.setTotalValue(total);
        snapshotRepository.save(snapshot);
    }

    private PortfolioEntryDto toDto(PortfolioEntry e) {
        Coin coin = e.getCoin();
        CoinPrice price = coin.getPrice();
        BigDecimal currentPrice = price != null ? price.getPriceUsd() : BigDecimal.ZERO;
        BigDecimal currentValue = e.getQuantity().multiply(currentPrice);
        BigDecimal cost = e.getQuantity().multiply(e.getBuyPrice());
        BigDecimal pnl = currentValue.subtract(cost);
        BigDecimal pnlPercent = cost.compareTo(BigDecimal.ZERO) != 0
            ? pnl.divide(cost, 6, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
            : BigDecimal.ZERO;

        return new PortfolioEntryDto(
            coin.getId(), coin.getName(), coin.getSymbol(), coin.getImageUrl(),
            e.getQuantity(), e.getBuyPrice(),
            currentPrice, currentValue, pnl, pnlPercent
        );
    }
}
