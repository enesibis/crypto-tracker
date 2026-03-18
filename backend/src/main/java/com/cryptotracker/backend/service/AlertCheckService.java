package com.cryptotracker.backend.service;

import com.cryptotracker.backend.controller.PriceStreamController;
import com.cryptotracker.backend.entity.CoinPrice;
import com.cryptotracker.backend.entity.PriceAlert;
import com.cryptotracker.backend.repository.CoinPriceRepository;
import com.cryptotracker.backend.repository.PriceAlertRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class AlertCheckService {

    private final PriceAlertRepository alertRepository;
    private final CoinPriceRepository coinPriceRepository;
    private final PriceStreamController priceStreamController;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AlertCheckService(PriceAlertRepository alertRepository,
                             CoinPriceRepository coinPriceRepository,
                             PriceStreamController priceStreamController) {
        this.alertRepository = alertRepository;
        this.coinPriceRepository = coinPriceRepository;
        this.priceStreamController = priceStreamController;
    }

    @Transactional
    public void checkAlerts() {
        List<PriceAlert> activeAlerts = alertRepository.findByTriggeredFalse();
        if (activeAlerts.isEmpty()) return;

        for (PriceAlert alert : activeAlerts) {
            CoinPrice price = coinPriceRepository.findByCoinId(alert.getCoin().getId()).orElse(null);
            if (price == null) continue;

            BigDecimal current = price.getPriceUsd();
            boolean fired = switch (alert.getCondition()) {
                case ABOVE -> current.compareTo(alert.getTargetPrice()) >= 0;
                case BELOW -> current.compareTo(alert.getTargetPrice()) <= 0;
            };

            if (fired) {
                alert.setTriggered(true);
                alertRepository.save(alert);
                try {
                    String payload = objectMapper.writeValueAsString(Map.of(
                        "alertId", alert.getId(),
                        "userEmail", alert.getUser().getEmail(),
                        "coinId", alert.getCoin().getId(),
                        "coinName", alert.getCoin().getName(),
                        "coinSymbol", alert.getCoin().getSymbol(),
                        "coinImage", alert.getCoin().getImageUrl() != null ? alert.getCoin().getImageUrl() : "",
                        "targetPrice", alert.getTargetPrice(),
                        "currentPrice", current,
                        "condition", alert.getCondition().name()
                    ));
                    priceStreamController.broadcastAlert(payload);
                    log.info("Alert tetiklendi: {} {} {}", alert.getCoin().getName(), alert.getCondition(), alert.getTargetPrice());
                } catch (Exception e) {
                    log.error("Alert broadcast hatası", e);
                }
            }
        }
    }
}
