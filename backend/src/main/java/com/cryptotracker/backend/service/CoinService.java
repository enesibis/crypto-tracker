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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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

    @Transactional(readOnly = true)
    public List<PriceHistoryDto> getHistory(String coinId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return priceHistoryRepository.findByCoinIdAndRecordedAtAfter(coinId, since)
                .stream()
                .map(ph -> new PriceHistoryDto(ph.getRecordedAt(), ph.getPriceUsd()))
                .toList();
    }

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

    // Sadece ilk sayfadan (top 100) history kaydedilir, geri kalanlar sadece fiyat güncellenir
    private static final int HISTORY_LIMIT = 100;

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
}
