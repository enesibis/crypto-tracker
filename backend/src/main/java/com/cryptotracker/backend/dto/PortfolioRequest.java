package com.cryptotracker.backend.dto;

import java.math.BigDecimal;

public record PortfolioRequest(String coinId, BigDecimal quantity, BigDecimal buyPrice) {}
