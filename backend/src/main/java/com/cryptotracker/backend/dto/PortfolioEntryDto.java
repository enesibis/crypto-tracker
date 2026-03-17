package com.cryptotracker.backend.dto;

import java.math.BigDecimal;

public record PortfolioEntryDto(
    String coinId,
    String coinName,
    String coinSymbol,
    String coinImageUrl,
    BigDecimal quantity,
    BigDecimal buyPrice,
    BigDecimal currentPrice,
    BigDecimal currentValue,
    BigDecimal pnl,
    BigDecimal pnlPercent
) {}
