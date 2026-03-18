package com.cryptotracker.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_alerts")
@Getter @Setter @NoArgsConstructor
public class PriceAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "coin_id", nullable = false)
    private Coin coin;

    @Column(name = "target_price", nullable = false, precision = 20, scale = 8)
    private BigDecimal targetPrice;

    @Column(nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    private AlertCondition condition;

    @Column(nullable = false)
    private Boolean triggered = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum AlertCondition { ABOVE, BELOW }
}
