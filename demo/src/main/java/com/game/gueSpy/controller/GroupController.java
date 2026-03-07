package com.game.gueSpy.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.game.gueSpy.dto.request.GroupRequest;
import com.game.gueSpy.dto.request.SelectionRequest;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.security.JwtUtil;
import com.game.gueSpy.service.GroupService;
import com.game.gueSpy.utility.GenericUtility;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/group")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping(
        path = "/create",
        name = "Create the group",
        produces = "application/json"
    )
    public ResponseEntity<?> create(@RequestHeader(value = "Authorization", required = true) String token, @RequestBody GroupRequest request){
        try {
            Long userId = jwtUtil.extractUserId(token.substring(7));
            return groupService.createNewGroup(request, userId);
        } catch (Exception e) {
            log.error("Failed to create new group {}", e);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping(
        path = "/get",
        name = "Create the group",
        produces = "application/json"
    )
    public ResponseEntity<?> get(@RequestHeader(value = "Authorization", required = true) String token, @RequestParam(required = false) Long groupId){
        try {
            Long userId = jwtUtil.extractUserId(token.substring(7));
            return groupService.getAllGroupForTheUser(userId, groupId);
        } catch (Exception e) {
            log.error("Failed to retrieve group {}", e);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(
        path = "/select",
        name = "select the group",
        produces = "application/json"
    )
    public ResponseEntity<?> select(@RequestHeader(value = "Authorization", required = true) String token, @RequestBody SelectionRequest request){
        try {
            Long userId = jwtUtil.extractUserId(token.substring(7));
            return groupService.selectGroup(userId, request.getId());
        } catch (Exception e) {
            log.error("Failed to select new group {}", e);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
        }
    }
}
