package com.game.gueSpy.service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.game.gueSpy.dto.request.AppConfigRequest;
import com.game.gueSpy.dto.response.AppConfigResponse;
import com.game.gueSpy.entity.AppConfig;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.repository.AppConfigRepository;
import com.game.gueSpy.utility.GenericUtility;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class ConfigService {

    private final AppConfigRepository appConfigRepository;

    private final Map<String, String> cache = new ConcurrentHashMap<>();

    @PostConstruct 
    public void loadOnStartup(){
        refresh();
    }

    public ResponseEntity<?> createNewConfig(AppConfigRequest request){
        log.info("User has started create config flow with this request body : {}", request);
        if(request.getKey() != null && !request.getKey().isEmpty() && request.getValue() != null && !request.getValue().isEmpty()){
            
            if(appConfigRepository.findByKey(request.getKey()).isPresent()){
                return GenericUtility.buildResponse(ResponseEnum.CONFIG_ALREADY_EXISTS);
            }

            AppConfig config = AppConfig.builder()
                    .key(request.getKey())
                    .value(request.getValue())
                    .active(true)
                    .build();
            
            appConfigRepository.save(config);
            refresh(); // Refresh cache to include new config
            
            log.info("Config created Successfully");
            return GenericUtility.buildResponse(ResponseEnum.CONFIG_CREATED);
        }
        log.info("request body : {}", request);
        return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
    }

    public ResponseEntity<?> updateConfig(AppConfigRequest request) {
        log.info("User has started update config flow with this request body : {}", request);
        if (request.getKey() != null && !request.getKey().isEmpty()) {
            var configOptional = appConfigRepository.findByKey(request.getKey());
            
            if (configOptional.isEmpty()) {
                return GenericUtility.buildResponse(ResponseEnum.CONFIG_NOT_EXISTS);
            }

            AppConfig config = configOptional.get();
            if (request.getValue() != null) {
                config.setValue(request.getValue());
            }
            
            appConfigRepository.save(config);
            refresh(); // Refresh cache to reflect updates

            log.info("Config updated Successfully");
            return GenericUtility.buildResponse(ResponseEnum.CONFIG_UPDATED);
        }
        log.info("request body : {}", request);
        return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING);
    }

    public ResponseEntity<?> getAllConfigs() {
        log.info("User has started get all config flow");
        List<AppConfig> configs = appConfigRepository.findAll();
        
        if (configs.isEmpty()) {
            return GenericUtility.buildResponse(ResponseEnum.NO_CONFIG_FOUND);
        }
        
        log.info("Configs retrieved successfully");
        AppConfigResponse configData = AppConfigResponse.builder().configs(configs).build();
        return GenericUtility.buildResponse(ResponseEnum.CONFIG_RETRIEVED, configData);
    }

    public void refresh(){
        log.info("Refreshing the config cache");
        cache.clear();

        appConfigRepository.findActiveConfigs()
                           .forEach(c -> cache.put(c.getKey(), c.getValue()));
        
        log.info("Config loaded");
    }

    public int getInt(String key){
        return Integer.parseInt(cache.get(key));
    }

    public long getLong(String key){
        return Long.parseLong(cache.get(key));
    }

    public boolean getBoolean(String key){
        return Boolean.parseBoolean(cache.get(key));
    }

    public String getString(String key){
        return cache.get(key);
    }
}
