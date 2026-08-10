package com.game.gueSpy.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.game.gueSpy.dto.request.AppConfigRequest;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.service.ConfigService;
import com.game.gueSpy.utility.GenericUtility;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/config")
@RequiredArgsConstructor
public class ConfigController {

    private final ConfigService configService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(
        path = "/create",
        name = "Create Config",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> createConfig(@RequestBody AppConfigRequest request) {
        return configService.createNewConfig(request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(path = "/refresh", name = "Refresh Config Cache")
    public ResponseEntity<?> refreshConfig() {
        configService.refresh();
        return GenericUtility.buildResponse(ResponseEnum.CONFIG_REFRESHED);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping(
        path = "/update",
        name = "Update Config",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> updateConfig(@RequestBody AppConfigRequest request) {
        return configService.updateConfig(request);
    }

    @GetMapping(path = "/get", name = "Get All Configs")
    public ResponseEntity<?> getAllConfigs() {
        return configService.getAllConfigs();
    }
}
