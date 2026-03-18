package com.cryptotracker.backend.controller;

import com.cryptotracker.backend.dto.PriceAlertDto;
import com.cryptotracker.backend.dto.PriceAlertRequest;
import com.cryptotracker.backend.entity.Coin;
import com.cryptotracker.backend.entity.PriceAlert;
import com.cryptotracker.backend.entity.User;
import com.cryptotracker.backend.repository.CoinRepository;
import com.cryptotracker.backend.repository.PriceAlertRepository;
import com.cryptotracker.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
public class PriceAlertController {

    private final PriceAlertRepository alertRepository;
    private final UserRepository userRepository;
    private final CoinRepository coinRepository;

    public PriceAlertController(PriceAlertRepository alertRepository,
                                UserRepository userRepository,
                                CoinRepository coinRepository) {
        this.alertRepository = alertRepository;
        this.userRepository = userRepository;
        this.coinRepository = coinRepository;
    }

    private User getUser(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername())
            .orElseThrow(() -> new IllegalStateException("Kullanıcı bulunamadı"));
    }

    @GetMapping
    public List<PriceAlertDto> getAlerts(@AuthenticationPrincipal UserDetails principal) {
        User user = getUser(principal);
        return alertRepository.findByUser(user).stream().map(this::toDto).toList();
    }

    @PostMapping
    public ResponseEntity<?> createAlert(@RequestBody PriceAlertRequest req,
                                         @AuthenticationPrincipal UserDetails principal) {
        User user = getUser(principal);
        Coin coin = coinRepository.findById(req.coinId())
            .orElseThrow(() -> new IllegalArgumentException("Coin bulunamadı: " + req.coinId()));

        PriceAlert alert = new PriceAlert();
        alert.setUser(user);
        alert.setCoin(coin);
        alert.setTargetPrice(req.targetPrice());
        alert.setCondition(req.condition());
        alertRepository.save(alert);
        return ResponseEntity.ok(toDto(alert));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAlert(@PathVariable Long id,
                                         @AuthenticationPrincipal UserDetails principal) {
        User user = getUser(principal);
        alertRepository.findById(id).ifPresent(alert -> {
            if (alert.getUser().getId().equals(user.getId())) {
                alertRepository.delete(alert);
            }
        });
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }

    private PriceAlertDto toDto(PriceAlert a) {
        Coin coin = a.getCoin();
        return new PriceAlertDto(
            a.getId(), coin.getId(), coin.getName(), coin.getSymbol(), coin.getImageUrl(),
            a.getTargetPrice(), a.getCondition(), a.getTriggered(), a.getCreatedAt()
        );
    }
}
