package com.cryptotracker.backend.dto;

import com.cryptotracker.backend.entity.PriceAlert;

import java.math.BigDecimal;

public record PriceAlertRequest(
    String coinId,
    BigDecimal targetPrice,
    PriceAlert.AlertCondition condition
) {}
