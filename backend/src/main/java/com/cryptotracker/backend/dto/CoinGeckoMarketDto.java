package com.cryptotracker.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// CoinGecko /coins/markets API response'una karşılık gelir
public record CoinGeckoMarketDto(
    String id,
    String symbol,
    String name,
    String image,

    @JsonProperty("current_price")
    BigDecimal currentPrice,

    @JsonProperty("market_cap")
    BigDecimal marketCap,

    @JsonProperty("total_volume")
    BigDecimal totalVolume,

    @JsonProperty("price_change_percentage_24h")
    BigDecimal priceChangePercentage24h,

    @JsonProperty("last_updated")
    LocalDateTime lastUpdated
) {}
