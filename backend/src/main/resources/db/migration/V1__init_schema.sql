-- Coins tablosu: her coin'in temel bilgileri
CREATE TABLE coins (
    id          VARCHAR(100) PRIMARY KEY,        -- coingecko id: "bitcoin"
    symbol      VARCHAR(20)  NOT NULL,           -- "btc"
    name        VARCHAR(100) NOT NULL,           -- "Bitcoin"
    image_url   TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Anlık fiyat bilgileri (sık güncellenir)
CREATE TABLE coin_prices (
    id                  BIGSERIAL PRIMARY KEY,
    coin_id             VARCHAR(100) NOT NULL REFERENCES coins(id),
    price_usd           NUMERIC(20, 8) NOT NULL,
    market_cap_usd      NUMERIC(24, 2),
    volume_24h_usd      NUMERIC(24, 2),
    price_change_24h    NUMERIC(10, 4),          -- yüzde değişim
    last_updated        TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (coin_id)
);

-- Fiyat geçmişi (grafik için)
CREATE TABLE price_history (
    id          BIGSERIAL PRIMARY KEY,
    coin_id     VARCHAR(100) NOT NULL REFERENCES coins(id),
    price_usd   NUMERIC(20, 8) NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_history_coin_recorded ON price_history(coin_id, recorded_at DESC);

-- Kullanıcılar
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Watchlist (kullanıcının takip ettiği coinler)
CREATE TABLE watchlist (
    user_id  BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coin_id  VARCHAR(100) NOT NULL REFERENCES coins(id) ON DELETE CASCADE,
    added_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, coin_id)
);
