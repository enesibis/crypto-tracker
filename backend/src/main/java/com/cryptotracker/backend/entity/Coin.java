package com.cryptotracker.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "coins")
@Getter @Setter @NoArgsConstructor
public class Coin {

    @Id
    @Column(length = 100)
    private String id;            // coingecko id: "bitcoin"

    @Column(length = 20, nullable = false)
    private String symbol;        // "btc"

    @Column(length = 100, nullable = false)
    private String name;          // "Bitcoin"

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToOne(mappedBy = "coin", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private CoinPrice price;
}
