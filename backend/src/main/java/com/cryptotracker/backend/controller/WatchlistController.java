package com.cryptotracker.backend.controller;

import com.cryptotracker.backend.dto.CoinDto;
import com.cryptotracker.backend.entity.Coin;
import com.cryptotracker.backend.entity.CoinPrice;
import com.cryptotracker.backend.entity.User;
import com.cryptotracker.backend.repository.CoinRepository;
import com.cryptotracker.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/watchlist")
public class WatchlistController {

    private final UserRepository userRepository;
    private final CoinRepository coinRepository;

    public WatchlistController(UserRepository userRepository, CoinRepository coinRepository) {
        this.userRepository = userRepository;
        this.coinRepository = coinRepository;
    }

    private User getUser(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername())
            .orElseThrow(() -> new IllegalStateException("Kullanıcı bulunamadı"));
    }

    @GetMapping
    public List<CoinDto> getWatchlist(@AuthenticationPrincipal UserDetails principal) {
        User user = getUser(principal);
        return user.getWatchlist().stream()
            .map(c -> {
                CoinPrice p = c.getPrice();
                return new CoinDto(
                    c.getId(), c.getSymbol(), c.getName(), c.getImageUrl(),
                    p != null ? p.getPriceUsd() : java.math.BigDecimal.ZERO,
                    p != null ? p.getMarketCapUsd() : java.math.BigDecimal.ZERO,
                    p != null ? p.getVolume24hUsd() : java.math.BigDecimal.ZERO,
                    p != null ? p.getPriceChange24h() : java.math.BigDecimal.ZERO,
                    p != null ? p.getLastUpdated() : java.time.LocalDateTime.now()
                );
            })
            .toList();
    }

    @PostMapping("/{coinId}")
    public ResponseEntity<?> addToWatchlist(@PathVariable String coinId,
                                             @AuthenticationPrincipal UserDetails principal) {
        User user = getUser(principal);
        Coin coin = coinRepository.findById(coinId)
            .orElseThrow(() -> new IllegalArgumentException("Coin bulunamadı: " + coinId));
        user.getWatchlist().add(coin);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("status", "added"));
    }

    @DeleteMapping("/{coinId}")
    public ResponseEntity<?> removeFromWatchlist(@PathVariable String coinId,
                                                  @AuthenticationPrincipal UserDetails principal) {
        User user = getUser(principal);
        user.getWatchlist().removeIf(c -> c.getId().equals(coinId));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("status", "removed"));
    }
}
