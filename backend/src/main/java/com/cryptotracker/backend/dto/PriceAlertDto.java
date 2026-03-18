package com.cryptotracker.backend.dto;

import com.cryptotracker.backend.entity.PriceAlert;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PriceAlertDto(
    Long id,
    String coinId,
    String coinName,
    String coinSymbol,
    String coinImage,
    BigDecimal targetPrice,
    PriceAlert.AlertCondition condition,
    Boolean triggered,
    LocalDateTime createdAt
) {}
