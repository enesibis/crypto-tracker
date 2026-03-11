package com.cryptotracker.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coin_prices")
@Getter @Setter @NoArgsConstructor
public class CoinPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coin_id", nullable = false, unique = true)
    private Coin coin;

    @Column(name = "price_usd", nullable = false, precision = 20, scale = 8)
    private BigDecimal priceUsd;

    @Column(name = "market_cap_usd", precision = 24, scale = 2)
    private BigDecimal marketCapUsd;

    @Column(name = "volume_24h_usd", precision = 24, scale = 2)
    private BigDecimal volume24hUsd;

    @Column(name = "price_change_24h", precision = 10, scale = 4)
    private BigDecimal priceChange24h;

    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated = LocalDateTime.now();
}
