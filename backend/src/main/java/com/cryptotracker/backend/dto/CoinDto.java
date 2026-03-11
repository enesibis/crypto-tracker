package com.cryptotracker.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CoinDto(
    String id,
    String symbol,
    String name,
    String imageUrl,
    BigDecimal priceUsd,
    BigDecimal marketCapUsd,
    BigDecimal volume24hUsd,
    BigDecimal priceChange24h,
    LocalDateTime lastUpdated
) {}
