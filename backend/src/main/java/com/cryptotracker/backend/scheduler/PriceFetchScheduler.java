package com.cryptotracker.backend.scheduler;

import com.cryptotracker.backend.controller.PriceStreamController;
import com.cryptotracker.backend.service.CoinGeckoClient;
import com.cryptotracker.backend.service.CoinService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PriceFetchScheduler {

    private final CoinGeckoClient coinGeckoClient;
    private final CoinService coinService;
    private final PriceStreamController priceStreamController;

    private static final int PER_PAGE = 250;
    private static final int TOTAL_PAGES = 8; // top 2000 coin

    @SuppressWarnings("BusyWait")
    @Scheduled(fixedRateString = "${app.coingecko.fetch-interval-ms:180000}")
    public void fetchAndUpdatePrices() {
        log.info("Fiyat güncelleme başladı (top {})...", PER_PAGE * TOTAL_PAGES);
        for (int p = 1; p <= TOTAL_PAGES; p++) {
            var coins = coinGeckoClient.getCoinsPage(PER_PAGE, p);
            if (coins.isEmpty()) {
                log.warn("Sayfa {} boş döndü, durduruluyor.", p);
                break;
            }
            coinService.upsertCoins(coins, (p - 1) * PER_PAGE);
            log.info("Sayfa {}/{} tamamlandı.", p, TOTAL_PAGES);
            if (p < TOTAL_PAGES) {
                try { Thread.sleep(2000); } catch (InterruptedException ignored) {}
            }
        }
        log.info("Fiyat güncelleme tamamlandı. {} SSE istemcisine bildirim gönderiliyor.", priceStreamController.getConnectedClients());
        priceStreamController.broadcastUpdate();
    }
}
