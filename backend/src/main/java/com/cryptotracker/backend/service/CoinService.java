package com.cryptotracker.backend.service;

import com.cryptotracker.backend.dto.CoinDto;
import com.cryptotracker.backend.dto.CoinGeckoMarketDto;
import com.cryptotracker.backend.dto.PagedResponse;
import com.cryptotracker.backend.dto.PriceHistoryDto;
import com.cryptotracker.backend.entity.Coin;
import com.cryptotracker.backend.entity.CoinPrice;
import com.cryptotracker.backend.entity.PriceHistory;
import com.cryptotracker.backend.repository.CoinPriceRepository;
import com.cryptotracker.backend.repository.CoinRepository;
import com.cryptotracker.backend.repository.PriceHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CoinService {

    private final CoinRepository coinRepository;
    private final CoinPriceRepository coinPriceRepository;
    private final PriceHistoryRepository priceHistoryRepository;

    // Frontend sort field → JPA property path
    private static final Map<String, String> SORT_FIELDS = Map.of(
            "name",          "name",
            "priceUsd",      "price.priceUsd",
            "marketCapUsd",  "price.marketCapUsd",
            "volume24hUsd",  "price.volume24hUsd",
            "priceChange24h","price.priceChange24h"
    );

    @Transactional(readOnly = true)
    public Optional<CoinDto> getCoinById(String coinId) {
        return coinRepository.findById(coinId).map(coin -> new CoinDto(
                coin.getId(),
                coin.getSymbol(),
                coin.getName(),
                coin.getImageUrl(),
                coin.getPrice().getPriceUsd(),
                coin.getPrice().getMarketCapUsd(),
                coin.getPrice().getVolume24hUsd(),
                coin.getPrice().getPriceChange24h(),
                coin.getPrice().getLastUpdated()
        ));
    }

    @Cacheable(value = "history", key = "#coinId + '-d' + #days")
    @Transactional(readOnly = true)
    public List<PriceHistoryDto> getHistory(String coinId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return priceHistoryRepository.findByCoinIdAndRecordedAtAfter(coinId, since)
                .stream()
                .map(ph -> new PriceHistoryDto(ph.getRecordedAt(), ph.getPriceUsd()))
                .toList();
    }

    @Cacheable(value = "history", key = "#coinId + '-h' + #hours")
    @Transactional(readOnly = true)
    public List<PriceHistoryDto> getHistoryByHours(String coinId, int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return priceHistoryRepository.findByCoinIdAndRecordedAtAfter(coinId, since)
                .stream()
                .map(ph -> new PriceHistoryDto(ph.getRecordedAt(), ph.getPriceUsd()))
                .toList();
    }

    @Cacheable(value = "coins", key = "#page + '-' + #size + '-' + #search + '-' + #sortBy + '-' + #sortDir")
    @Transactional(readOnly = true)
    public PagedResponse<CoinDto> getCoins(int page, int size, String search, String sortBy, String sortDir) {
        String jpaField = SORT_FIELDS.getOrDefault(sortBy, "price.marketCapUsd");
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = Sort.by(direction, jpaField);

        String searchParam = (search == null || search.isBlank()) ? "" : search.trim();
        Page<Coin> coinPage = coinRepository.findCoins(searchParam, PageRequest.of(page, size, sort));

        List<CoinDto> content = coinPage.getContent().stream()
                .map(coin -> new CoinDto(
                        coin.getId(),
                        coin.getSymbol(),
                        coin.getName(),
                        coin.getImageUrl(),
                        coin.getPrice().getPriceUsd(),
                        coin.getPrice().getMarketCapUsd(),
                        coin.getPrice().getVolume24hUsd(),
                        coin.getPrice().getPriceChange24h(),
                        coin.getPrice().getLastUpdated()
                ))
                .toList();
        return new PagedResponse<>(content, page, size, coinPage.getTotalElements(), coinPage.getTotalPages());
    }

    @Transactional(readOnly = true)
    public List<CoinDto> getTopGainers(int limit) {
        return coinRepository.findTopGainers(PageRequest.of(0, limit))
                .stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<CoinDto> getTopLosers(int limit) {
        return coinRepository.findTopLosers(PageRequest.of(0, limit))
                .stream().map(this::toDto).toList();
    }

    private CoinDto toDto(Coin coin) {
        return new CoinDto(coin.getId(), coin.getSymbol(), coin.getName(), coin.getImageUrl(),
                coin.getPrice().getPriceUsd(), coin.getPrice().getMarketCapUsd(),
                coin.getPrice().getVolume24hUsd(), coin.getPrice().getPriceChange24h(),
                coin.getPrice().getLastUpdated());
    }

    // Sadece ilk sayfadan (top 100) history kaydedilir, geri kalanlar sadece fiyat güncellenir
    private static final int HISTORY_LIMIT = 100;

    @CacheEvict(value = {"coins", "coin", "history"}, allEntries = true)
    @Transactional
    public void upsertCoins(List<CoinGeckoMarketDto> marketData, int rankOffset) {
        LocalDateTime now = LocalDateTime.now();
        for (int i = 0; i < marketData.size(); i++) {
            CoinGeckoMarketDto data = marketData.get(i);
            if (data.currentPrice() == null) continue;

            Coin coin = coinRepository.findById(data.id()).orElseGet(() -> {
                Coin c = new Coin();
                c.setId(data.id());
                return c;
            });
            coin.setSymbol(data.symbol().toLowerCase());
            coin.setName(data.name());
            coin.setImageUrl(data.image());
            coinRepository.save(coin);

            CoinPrice price = coinPriceRepository.findByCoinId(data.id())
                    .orElseGet(() -> {
                        CoinPrice p = new CoinPrice();
                        p.setCoin(coin);
                        return p;
                    });
            price.setPriceUsd(data.currentPrice());
            price.setMarketCapUsd(data.marketCap());
            price.setVolume24hUsd(data.totalVolume());
            price.setPriceChange24h(data.priceChangePercentage24h());
            price.setLastUpdated(now);
            coinPriceRepository.save(price);

            // Sadece top 100 için history kaydet
            int globalRank = rankOffset + i + 1;
            if (globalRank <= HISTORY_LIMIT) {
                PriceHistory history = new PriceHistory();
                history.setCoin(coin);
                history.setPriceUsd(data.currentPrice());
                history.setRecordedAt(now);
                priceHistoryRepository.save(history);
            }
        }
        log.info("{} coin güncellendi (offset={}).", marketData.size(), rankOffset);
    }

    /**
     * Binance WebSocket'ten gelen toplu fiyat güncellemelerini DB'ye yazar.
     * @param updates symbol → [price, change24h, volume] (change/volume null olabilir)
     * @return symbol → [price, change24h] map (SSE'ye broadcast edilmek üzere)
     */
    @CacheEvict(value = {"coins", "coin", "history"}, allEntries = true)
    @Transactional
    public Map<String, double[]> bulkUpdatePricesFromBinance(Map<String, BigDecimal[]> updates, boolean storeHistory) {
        Map<String, double[]> result = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();

        for (Map.Entry<String, BigDecimal[]> entry : updates.entrySet()) {
            String symbol = entry.getKey();
            BigDecimal[] values = entry.getValue(); // [price, change24h, volume]

            List<Coin> coins = coinRepository.findBySymbol(symbol);
            if (coins.isEmpty()) continue;
            Coin coin = coins.get(0);

            coinPriceRepository.findByCoinId(coin.getId()).ifPresent(cp -> {
                cp.setPriceUsd(values[0]);
                if (values[1] != null) cp.setPriceChange24h(values[1]);
                if (values[2] != null) cp.setVolume24hUsd(values[2]);
                cp.setLastUpdated(now);
                coinPriceRepository.save(cp);

                // Dakikada bir history snapshot al (saatlik grafik için)
                if (storeHistory) {
                    PriceHistory history = new PriceHistory();
                    history.setCoin(coin);
                    history.setPriceUsd(values[0]);
                    history.setRecordedAt(now);
                    priceHistoryRepository.save(history);
                }

                double change = values[1] != null ? values[1].doubleValue()
                        : (cp.getPriceChange24h() != null ? cp.getPriceChange24h().doubleValue() : 0.0);
                result.put(symbol, new double[]{values[0].doubleValue(), change});
            });
        }
        return result;
    }
}
