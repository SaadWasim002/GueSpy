package com.game.gueSpy.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.game.gueSpy.dto.request.GroupRequest;
import com.game.gueSpy.dto.request.SelectionRequest;
import com.game.gueSpy.enums.ResponseEnum;
import com.game.gueSpy.security.UserPrincipal;
import com.game.gueSpy.service.GroupService;
import com.game.gueSpy.utility.GenericUtility;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/group")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping(
        path = "/create",
        name = "Create the group",
        produces = "application/json"
    )
    public ResponseEntity<?> create(@AuthenticationPrincipal UserPrincipal principal, @RequestBody GroupRequest request){
        try {
            return groupService.createNewGroup(request, principal.userId());
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
    public ResponseEntity<?> get(@AuthenticationPrincipal UserPrincipal principal, @RequestParam(required = false) Long groupId){
        try {
            return groupService.getAllGroupForTheUser(principal.userId(), groupId);
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
    public ResponseEntity<?> select(@AuthenticationPrincipal UserPrincipal principal, @RequestBody SelectionRequest request){
        try {
            return groupService.selectGroup(principal.userId(), request.getId());
        } catch (Exception e) {
            log.error("Failed to select new group {}", e);
            return GenericUtility.buildResponse(ResponseEnum.INTERNAL_SERVER_ERROR);
        }
    }
}
