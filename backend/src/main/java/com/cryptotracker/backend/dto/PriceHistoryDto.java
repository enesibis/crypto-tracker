package com.cryptotracker.backend.dto;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PriceHistoryDto(
    LocalDateTime recordedAt,
    BigDecimal priceUsd
) implements Serializable {}
