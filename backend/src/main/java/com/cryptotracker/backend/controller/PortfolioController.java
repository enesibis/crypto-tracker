package com.cryptotracker.backend.controller;

import com.cryptotracker.backend.dto.PortfolioEntryDto;
import com.cryptotracker.backend.dto.PortfolioRequest;
import com.cryptotracker.backend.entity.Coin;
import com.cryptotracker.backend.entity.CoinPrice;
import com.cryptotracker.backend.entity.PortfolioEntry;
import com.cryptotracker.backend.entity.User;
import com.cryptotracker.backend.repository.CoinRepository;
import com.cryptotracker.backend.repository.PortfolioRepository;
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

    public PortfolioController(PortfolioRepository portfolioRepository,
                               UserRepository userRepository,
                               CoinRepository coinRepository) {
        this.portfolioRepository = portfolioRepository;
        this.userRepository = userRepository;
        this.coinRepository = coinRepository;
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
