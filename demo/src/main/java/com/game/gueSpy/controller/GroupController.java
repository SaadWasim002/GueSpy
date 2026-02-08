package com.game.gueSpy.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.game.gueSpy.dto.GenericResponse;
import com.game.gueSpy.dto.request.GroupRequest;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.service.GroupService;
import com.game.gueSpy.utility.GenericUtility;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/group")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @PostMapping(
        path = "/create",
        name = "Create the group",
        consumes = "application/json",
        produces = "application/json"
    )
    public ResponseEntity<?> create(@RequestHeader(value = "X-User-Id", required = true) Long userId, @RequestBody GroupRequest request){
        try {
            return groupService.createNewGroup(request, userId);
        } catch (Exception e) {
            log.error("Failed to create new group {}", e);
            GenericResponse response = GenericUtility.buildGenericResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR, response);
        }
    }
}
