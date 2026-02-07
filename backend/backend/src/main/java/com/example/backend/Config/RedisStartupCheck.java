package com.example.backend.Config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.RedisTemplate;

@Configuration
public class RedisStartupCheck {

    @Bean
    CommandLineRunner redisCheck(RedisTemplate<String, Object> redisTemplate) {
        return args -> {
            redisTemplate.opsForValue().set("redis-check", "OK");
            Object value = redisTemplate.opsForValue().get("redis-check");
            System.out.println("REDIS VALUE = " + value);
        };
    }
}

