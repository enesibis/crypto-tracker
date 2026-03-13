package com.cryptotracker.backend.controller;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.net.URI;

@RestController
@RequestMapping("/api/news")
public class NewsController {

    private final WebClient cryptoCompareWebClient;

    public NewsController(@Qualifier("cryptoCompareWebClient") WebClient cryptoCompareWebClient) {
        this.cryptoCompareWebClient = cryptoCompareWebClient;
    }

    @GetMapping("/{symbol}")
    public Mono<ResponseEntity<String>> getNews(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "") String name) {

        String query = (name.isBlank() ? symbol.toUpperCase() : name + " " + symbol.toUpperCase()) + " cryptocurrency";
        String googleNewsRss = "https://news.google.com/rss/search?q=" + query.replace(" ", "+") + "&hl=en&gl=US&ceid=US:en";
        String fullUrl = "https://api.rss2json.com/v1/api.json?rss_url=" + googleNewsRss.replace(":", "%3A").replace("/", "%2F").replace("?", "%3F").replace("=", "%3D").replace("&", "%26").replace("+", "%2B");

        return WebClient.create().get()
                .uri(URI.create(fullUrl))
                .retrieve()
                .bodyToMono(String.class)
                .doOnError(e -> System.err.println("NEWS ERROR: " + e.getMessage()))
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.ok("{\"items\":[]}"));
    }
}
