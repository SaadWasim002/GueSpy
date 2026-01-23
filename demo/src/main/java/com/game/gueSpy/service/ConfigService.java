package com.game.gueSpy.service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.dto.request.AppConfigRequest;
import com.game.gueSpy.dto.response.AppConfigResponse;
import com.game.gueSpy.entity.AppConfig;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.repository.AppConfigRepository;
import com.game.gueSpy.utility.GenericUtility;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ConfigService {
    
    @Autowired
    private AppConfigRepository appConfigRepository;

    private Map<String, String> cache = new ConcurrentHashMap<>();

    @PostConstruct 
    public void loadOnStartup(){
        refresh();
    }

    public ResponseEntity<?> createNewConfig(AppConfigRequest request){
        log.info("User has started create config flow with this request body : {}", request);
        if(request.getKey() != null && !request.getKey().isEmpty() && request.getValue() != null && !request.getValue().isEmpty()){
            
            if(appConfigRepository.findByKey(request.getKey()).isPresent()){
                GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.CONFIG_ALREADY_EXISTS);
                return GenericUtility.buildResponse(ResponseEnum.CONFIG_ALREADY_EXISTS, response);
            }

            AppConfig config = AppConfig.builder()
                    .key(request.getKey())
                    .value(request.getValue())
                    .active(true)
                    .build();
            
            appConfigRepository.save(config);
            refresh(); // Refresh cache to include new config
            
            log.info("Config created Successfully");
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.CONFIG_CREATED);
            return GenericUtility.buildResponse(ResponseEnum.CONFIG_CREATED, response);
        }
        log.info("request body : {}", request);
        GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.VALUES_MISSING);
        return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING, response);
    }

    public ResponseEntity<?> updateConfig(AppConfigRequest request) {
        log.info("User has started update config flow with this request body : {}", request);
        if (request.getKey() != null && !request.getKey().isEmpty()) {
            var configOptional = appConfigRepository.findByKey(request.getKey());
            
            if (configOptional.isEmpty()) {
                GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.CONFIG_NOT_EXISTS);
                return GenericUtility.buildResponse(ResponseEnum.CONFIG_NOT_EXISTS, response);
            }

            AppConfig config = configOptional.get();
            if (request.getValue() != null) {
                config.setValue(request.getValue());
            }
            
            appConfigRepository.save(config);
            refresh(); // Refresh cache to reflect updates

            log.info("Config updated Successfully");
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.CONFIG_UPDATED);
            return GenericUtility.buildResponse(ResponseEnum.CONFIG_UPDATED, response);
        }
        log.info("request body : {}", request);
        GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.VALUES_MISSING);
        return GenericUtility.buildResponse(ResponseEnum.VALUES_MISSING, response);
    }

    public ResponseEntity<?> getAllConfigs() {
        log.info("User has started get all config flow");
        List<AppConfig> configs = appConfigRepository.findAll();
        
        if (configs.isEmpty()) {
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.NO_CONFIG_FOUND);
            return GenericUtility.buildResponse(ResponseEnum.NO_CONFIG_FOUND, response);
        }
        
        log.info("Configs retrieved successfully");
        AppConfigResponse response = AppConfigResponse.builder()
                .status(ResponseEnum.CONFIG_RETRIEVED.getStatus())
                .message(ResponseEnum.CONFIG_RETRIEVED.getMessage())
                .configs(configs)
                .build();
        return GenericUtility.buildResponse(ResponseEnum.CONFIG_RETRIEVED, response);
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
