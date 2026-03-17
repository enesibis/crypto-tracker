package com.cryptotracker.backend.dto;

import java.io.Serializable;

public record GlobalMarketDto(
    double totalMarketCapUsd,
    double totalVolumeUsd,
    double btcDominance,
    double marketCapChangePercentage24h
) implements Serializable {}
