package com.game.gueSpy.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.dto.request.AppConfigRequest;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.service.ConfigService;
import com.game.gueSpy.utility.GenericUtility;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/config")
public class ConfigController {

    @Autowired
    private ConfigService configService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(
        path = "/create",
        name = "Create Config",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> createConfig(@RequestBody AppConfigRequest request) {
        try {
            return configService.createNewConfig(request);
        } catch (Exception e) {
            log.error("Error creating config", e);
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR, response);
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(path = "/refresh", name = "Refresh Config Cache")
    public ResponseEntity<?> refreshConfig() {
        try {
            configService.refresh();
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.CONFIG_REFRESHED);
            return GenericUtility.buildResponse(ResponseEnum.CONFIG_REFRESHED, response);
        } catch (Exception e) {
            log.error("Error refreshing config", e);
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR, response);
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping(
        path = "/update",
        name = "Update Config",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> updateConfig(@RequestBody AppConfigRequest request) {
        try {
            return configService.updateConfig(request);
        } catch (Exception e) {
            log.error("Error updating config", e);
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR, response);
        }
    }

    @GetMapping(path = "/get", name = "Get All Configs")
    public ResponseEntity<?> getAllConfigs() {
        try {
            return configService.getAllConfigs();
        } catch (Exception e) {
            log.error("Error getting configs", e);
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR, response);
        }
    }
}