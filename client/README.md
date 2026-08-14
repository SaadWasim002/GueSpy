# GueSpy Frontend Product Requirements Document (PRD)

## 1. Introduction

### 1.1. Purpose
This document outlines the product requirements for the GueSpy frontend application. The primary goal is to create a sleek, modern, minimalist, and dark-themed user interface that facilitates user authentication and the initial game setup flow, specifically category selection.

### 1.2. Scope
This PRD covers the full single-device (pass-and-play) game flow:
- User Authentication: Registration and Login (logout is client-side only).
- Game setup: determining game state, starting/resetting a game, category selection, group (player list) selection, and game options (number of spies).
- Gameplay: word & spy reveal, discussion timer, voting, and the multi-round outcome flow — revote, spy guess, round end, and the final scoring/result screen.
- Global Error Handling.

The game is currently **single-device pass-and-play**: one authenticated user drives all players on one device. Future phases will cover an ADMIN interface and (eventually) multi-device play.

### 1.3. Target Audience
This document is intended for frontend developers, UI/UX designers, and quality assurance engineers involved in the GueSpy project.

## 2. UI/UX Design Principles

### 2.1. Visual Style
- **Theme**: Dark mode, minimalist design.
- **Aesthetics**: Sleek, modern, and clean. Emphasis on clear typography, subtle animations, and intuitive layouts.
- **Color Palette**: Predominantly dark backgrounds with contrasting, muted accent colors for interactive elements and text. Avoid overly bright or distracting elements.
- **Typography**: Use a legible, modern sans-serif font.
- **Iconography**: Simple, clear icons to enhance usability without clutter.

### 2.2. Component Reusability
- All UI components (e.g., buttons, input fields, modals, loading indicators, error messages) must be designed and implemented for maximum reusability across the application. This ensures consistency, reduces development time, and simplifies maintenance.

## 3. Functional Requirements

This section details the functional requirements of the application. All successful API responses that return data follow a consistent structure where the payload is nested under a `data` key, alongside `message` and `status` keys.

### 3.1. Authentication Module

#### 3.1.1. User Registration
- **Description**: Allows new users to create an account.
- **UI**: A dedicated registration screen with input fields for:
    - Username
    - Email
    - Password (with a "Show/Hide Password" toggle)
    - Confirm Password
- **Actions**:
    - "Register" button: Submits the form.
    - "Already have an account? Login": Navigates to the login screen.
- **API Endpoint**: `POST http://localhost:8080/auth/register`
    - **Request**: `{ "username": "...", "email": "...", "password": "..." }`
    - **Success (201 CREATED)**: Display a success message (e.g., "Registration successful! Please log in."), store the received JWT token from the `data.token` field, and extract the `userId` from it. Automatically log the user in or redirect to the login screen.
        ```json
        {
            "data": {
                "token": "eyJhbGciOiJIUzI1NiJ9..."
            },
            "message": "User registered successfully",
            "status": "201 CREATED"
        }
        ```
    - **Error (409 CONFLICT)**: Display "User already exists with this email."
    - **Error (400 BAD_REQUEST)**: Display "Some fields are missing or invalid."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.1.2. User Login
- **Description**: Allows existing users to log in.
- **UI**: A dedicated login screen with input fields for:
    - Email
    - Password (with a "Show/Hide Password" toggle)
- **Actions**:
    - "Login" button: Submits the form.
    - "Don't have an account? Register": Navigates to the registration screen.
- **API Endpoint**: `POST http://localhost:8080/auth/login`
    - **Request**: `{ "email": "...", "password": "..." }`
    - **Success (200 OK)**: Display "Login Successful", store the received JWT token from the `data.token` field, and extract the `userId` from it. Redirect to the Initial Game Screen.
        ```json
        {
            "data": {
                "token": "eyJhbGciOiJIUzI1NiJ9..."
            },
            "message": "Login Successful",
            "status": "200 OK"
        }
        ```
    - **Error (401 UNAUTHORIZED)**: Display "Incorrect email or password."
    - **Error (404 NOT_FOUND)**: Display "No user exists with this email."
    - **Error (400 BAD_REQUEST)**: Display "Email and password are required."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.1.3. User Logout
- **Description**: Allows a logged-in user to end their session.
- **UI**: A "Logout" button or link, typically accessible from a user profile menu or header.
- **Actions**:
    - On click: Clears the stored JWT token from client-side storage and redirects to the Login/Registration screen.
- **API Endpoint**: None. Authentication is **stateless JWT**, so there is no `/auth/logout` endpoint — logout is purely client-side (discard the stored token). The token naturally expires after ~1 hour.

### 3.2. Game Initialization & Category Selection Module

#### 3.2.1. Initial Game Screen
- **Description**: The first screen a user sees after logging in or after a game reset, offering options to continue or start fresh.
- **UI**: A central screen with two prominent, distinct buttons:
    - "Continue Game"
    - "New Game"
- **Logic**: This screen is displayed after the frontend determines the current game status via `GET /game-engine/get-screen`.

#### 3.2.2. New Game Flow
- **Description**: Resets the user's current game progress and starts a new game.
- **Trigger**: User clicks the "New Game" button.
- **API Endpoint**: `POST http://localhost:8080/game-engine/reset`
    - **Request Headers**:  `Authorization: Bearer <token>` 
    - **Success (200 OK)**: Upon successful reset, the frontend must immediately call `GET /game-engine/get-screen` to determine the next screen, which should be `CATEGORY_SELECTION`.
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.2.3. Current Screen Determination
- **Description**: Determines the user's current game state and navigates to the appropriate screen. This API call is crucial and should be made:
    1.  Immediately after successful login.
    2.  Immediately after a successful "New Game" reset.
- **API Endpoint**: `GET http://localhost:8080/game-engine/get-screen`
    - **Request Headers**:  `Authorization: Bearer <token>`
    - **Expected Response**: A DTO containing `gameStatus` at the root level, and other screen-specific data within a `data` object.
    - **Logic**:
        - The frontend will navigate to the appropriate screen based on the `gameStatus` value.
        - `NOT_STARTED` or `CATEGORY_SELECTION`: Navigate to Category Selection Screen.
        - `GROUP_SELECTION`: Navigate to Group Selection Screen.
        - `GAME_OPTION_SELECTION`: Navigate to Game Option Selection Screen.
        - `WORD_AND_SPY_REVEAL`: Navigate to Word and Spy Reveal Screen.
        - `DISCUSSION_TIME`: Navigate to Discussion Time Screen.
        - `VOTING` or `REVOTE`: Navigate to Voting Screen.
        - `SPY_GUESS`: Navigate to Spy Guess Screen (see 3.2.12).
        - `ROUND_END`: Navigate to Round End Screen (see 3.2.13).
        - `SCORING`: Navigate to Scoring / Result Screen (see 3.2.14).
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.2.4. Category Selection Screen
- **Description**: Allows the user to browse and select a game category.
- **UI**:
    - A clear title: "Select a Category".
    - A scrollable list or grid of available categories. Each category item should display its `categoryName`.
    - Each category item should be clickable.
    - A visual indicator for the currently selected category.
    - **Future Considerations**:
        - Support for random category selection (e.g., a "Surprise Me!" button).
        - Display an image on each category card.
        - Allow multi-selection of categories (if game logic supports it).
    - A "Continue" or "Next" button to confirm the selection (optional, or selection can trigger immediate progression).
- **API Endpoint (Get Categories)**: `GET http://localhost:8080/category/get`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK)**: Display the list of categories from the `data.categories` array in the response.
        ```json
        {
            "data": {
                "categories": [
                    {
                        "id": 1,
                        "categoryName": "Movies",
                        "totalWords": 50
                    },
                    {
                        "id": 2,
                        "categoryName": "Sports",
                        "totalWords": 35
                    }
                ]
            },
            "message": "Categories retrieved successfully",
            "status": "200 OK"
        }
        ```
    - **Error (404 NOT_FOUND - NO_CATEGORY_FOUND)**: Display "No categories available. Please check back later."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Select Category)**: `POST http://localhost:8080/category/select`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Request Body**: `{ "id": <selectedCategoryId> }`
    - **Success (200 OK)**: Display "Category selected successfully." The frontend must then immediately call `GET /game-engine/get-screen` to determine the next screen (expected to be `GROUP_SELECTION`). The response contains no data.
    - **Error (404 NOT_FOUND - CATEGORY_NOT_EXISTS)**: Display "Selected category does not exist or is no longer available."
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Display "Invalid game state for category selection."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.2.5. Group Selection Screen
- **Description**: Allows the user to manage and select a group of players for the game. This screen is displayed when the `gameStatus` from `GET /game-engine/get-screen` is `GROUP_SELECTION`.
- **UI**:
    - A clear title: "Select or Create a Group".
    - A section displaying a list or grid of existing groups for the user. Each group item should prominently display the `groupName`.
    - Each group item should be clickable to view/edit group details.
    - A prominent "Add New Group" button.
    - **Group Details/Edit View (Modal or New Screen)**:
        - Displays `groupName` and a list of `playerNames`.
        - Allows editing `groupName` and `playerNames`.
        - "Save Changes" button.
        - "Delete Group" button (with confirmation).
    - **Add New Group Form (Modal or New Screen)**:
        - Input field for "Group Name".
        - Initial input field for "Player 1 Name".
        - A button "Add another player" which dynamically adds a new input field for a player name.
        - Validation:
            - Group name is required.
            - Player names are required.
            - Number of players must be within the configured min/max limits (fetched from `/config/get`).
        - "Create Group" button.
- **API Endpoint (Get All Groups)**: `GET http://localhost:8080/group/get`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK)**: Display the list of groups. Frontend should also check `max_group_allowed` config to disable "Add New Group" button if limit is reached.
    - **Error (404 NOT_FOUND - NO_GROUP_FOUND)**: Display "No groups found. Start by creating one!"
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Get Particular Group)**: `GET http://localhost:8080/group/get?groupId={id}`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK)**: Display details of the requested group.
    - **Error (404 NOT_FOUND - NO_GROUP_FOUND)**: Display "Group not found."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Create Group)**: `POST http://localhost:8080/group/create`
    - **Request Headers**: `Authorization: Bearer <token>` (Backend will extract `userId` from JWT)
    - **Request Body**:
        ```json
        {
            "group_name": "...",
            "players": [
                "Player1 Name",
                "Player2 Name"
            ]
        }
        ```
    - **Success (201 CREATED)**: Display "Group created successfully." Refresh the list of groups.
    - **Error (409 CONFLICT - GROUP_ALREADY_EXISTS)**: Display "A group with this name already exists."
    - **Error (400 BAD_REQUEST)**: Display "Group name and player names are required." or "Number of players out of bounds."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Update Group)**: `PUT http://localhost:8080/group/get?groupId={id}`
    - **Description**: This endpoint is planned for the current backend version. Frontend should implement the UI and logic to call this API.
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Request Body**: (Backend will extract `userId` from JWT)
        ```json
        {
            "group": {
                "id": <groupId>,
                "userId": <userId_from_JWT>,
                "groupName": "Updated Group Name",
                "players": {
                    "playerNames": [
                        "Updated Player1",
                        "Updated Player2"
                    ]
                }
            }
        }
        ```
    - **Success (200 OK)**: Display "Group updated successfully." Refresh the list of groups.
    - **Error (404 NOT_FOUND - NO_GROUP_FOUND)**: Display "Group not found."
    - **Error (400 BAD_REQUEST)**: Display "Invalid group data provided."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Select Group)**: `POST http://localhost:8080/group/select`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Request Body**: `{ "id": <selectedGroupId> }`
    - **Success (200 OK)**: Display "Group selected successfully." The frontend must then immediately call `GET /game-engine/get-screen` to determine the next screen (expected to be `GAME_OPTION_SELECTION`).
    - **Error (404 NOT_FOUND - NO_GROUP_FOUND)**: Display "Selected group does not exist."
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Display "Invalid game state for group selection."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.2.6. Configuration for Group Player Limits
- **Description**: The frontend needs to fetch configuration values for minimum and maximum players allowed in a group to enforce validation during group creation/update.
- **API Endpoint**: `GET http://localhost:8080/config/get`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Expected Response**: A list of configurations, including `key: "max_player_allowed_in_group"`, `key: "min_player_allowed_in_group"`, and `key: "max_group_allowed"`.
    - **Logic**:
        - On loading the group creation/edit form, fetch these configurations.
        - Use the `value` field from the response to set validation rules for the number of players.
        - Use the `value` field for `max_group_allowed` to limit the number of groups a user can create.
    - **Error (404 NOT_FOUND - NO_CONFIG_FOUND)**: Display a default message or use hardcoded defaults if config is critical.
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.2.7. Game Option Selection Screen
- **Description**: Allows the user to configure game-specific options, starting with the number of spies. This screen is displayed when the `gameStatus` from `GET /game-engine/get-screen` is `GAME_OPTION_SELECTION`.
- **UI**:
    - A clear title: "Configure Game Options".
    - A section for "Number of Spies":
        - Displays the current selected number of spies.
        - "Increase" button to increment the number of spies.
        - "Decrease" button to decrement the number of spies.
        - The buttons should be disabled if the minimum or maximum limit (fetched from configuration) is reached.
        - A message should be displayed (e.g., a small pop-up or inline text) if a limit is reached upon attempting to change the value.
    - A "Start Game" or "Continue" button to proceed.
- **API Endpoint (Set Game Options)**: `POST http://localhost:8080/game-engine/game-option`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Request Body**:
        ```json
        {
            "number_of_spy": <selectedNumberOfSpies>
        }
        ```
    - **Success (200 OK)**: Display "Game options set successfully." The frontend must then immediately call `GET /game-engine/get-screen` to determine the next screen (expected to be `WORD_AND_SPY_REVEAL`).
    - **Error (400 BAD_REQUEST - INVALID_NUMBER_OF_SPY)**: Display "Invalid number of spies. Please select between X and Y." (where X and Y are min/max from config).
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Display "Invalid game state for game option selection."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Configuration for Number of Spies)**: `GET http://localhost:8080/config/get`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Expected Response**: A list of configurations, including `key: "min_spy_allowed"` and `key: "max_spy_allowed"` (assuming these will be added).
    - **Logic**:
        - On loading the game option selection screen, fetch these configurations.
        - Use the `value` fields to set the bounds for the number of spies.
    - **Error (404 NOT_FOUND - NO_CONFIG_FOUND)**: Display a default message or use hardcoded defaults if config is critical.
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.


### 5.5. Project Structure and Modularity

To ensure maintainability, scalability, and efficient collaboration, the frontend project will adhere to a well-defined, modular folder structure, reflecting top industry-level expert practices. This approach promotes clear separation of concerns, making it easier to locate, understand, and manage different parts of the application.

A recommended structure for a modern React application would be:

```
src/
├── assets/                 # Static assets like images, fonts, icons
│   ├── images/
│   ├── fonts/
│   └── icons/
├── components/             # Reusable UI components (e.g., Button, InputField, Card)
│   ├── common/             # Highly generic components (e.g., Button, Modal, LoadingSpinner)
│   ├── auth/               # Auth-specific reusable components (e.g., AuthForm, PasswordInput)
│   └── game/               # Game-specific reusable components (e.g., PlayerCard, CategoryCard)
├── config/                 # Application-wide configurations (e.g., API endpoints, constants, feature flags)
├── hooks/                  # Custom React hooks for encapsulating reusable logic (e.g., useAuth, useGame)
├── layouts/                # Layout components (e.g., AuthLayout, GameLayout, AdminLayout)
├── pages/                  # Top-level views/screens, often corresponding to routes
│   ├── Auth/
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   ├── Game/
│   │   ├── InitialGameScreen.jsx
│   │   ├── CategorySelectionScreen.jsx
│   │   ├── GroupSelectionScreen.jsx
│   │   ├── GameOptionSelectionScreen.jsx
│   │   └── WordSpyRevealScreen.jsx
│   └── Admin/              # Future admin screens
├── services/               # API interaction logic, abstracting HTTP requests (e.g., authService.js, gameService.js)
├── store/                  # State management (e.g., Redux slices, Zustand stores, or Context API providers)
│   ├── authSlice.js        # Auth-related state
│   ├── gameSlice.js        # Game-related state
│   └── index.js            # Root store configuration
├── styles/                 # Global styles, themes, utility classes, and component-specific styling
│   ├── base/               # Global resets, typography
│   ├── themes/             # Dark/light themes, color variables
│   └── utils/              # Utility classes (e.g., spacing, flex helpers)
├── utils/                  # Pure utility functions (e.g., date formatting, JWT decoding, validation helpers)
├── App.jsx                 # Main application component, often handles routing
├── index.js                # Entry point for the React application
└── routes.js               # Centralized route definitions and protected routes logic
```

**Key Principles for Industry-Level Codebase:**

*   **Feature-based or Domain-based Grouping**: Components, pages, and related logic are grouped by feature or domain (e.g., `Auth`, `Game`). This enhances discoverability and reduces cognitive load.
*   **Strict Separation of Concerns**: UI components, business logic, API calls, and state management are kept in distinct layers. This makes each part easier to test, maintain, and understand independently.
*   **High Reusability**: Common UI elements and logic are developed as generic, prop-driven components and custom hooks to be reused across the application, ensuring consistency and reducing redundancy.
*   **Clear Naming Conventions**: Consistent and descriptive naming for files, folders, and variables is crucial for team collaboration and long-term maintainability.
*   **Scalability and Extensibility**: The structure is designed to easily accommodate new features, modules, and team members without becoming unwieldy or introducing significant refactoring.
*   **Testability**: The modular nature naturally lends itself to easier unit, integration, and end-to-end testing.

This robust structure will facilitate a clean, efficient, and scalable codebase, improve developer onboarding, and streamline future development efforts, aligning with best practices in professional software engineering.

#### 3.2.8. Word and Spy Reveal Screen (`WORD_AND_SPY_REVEAL`)
- **Description**: This screen guides players through revealing their roles (whether they are a spy or not) and their assigned word (for non-spies). It involves a "pass the device" mechanism to ensure each player sees their role privately. This screen is displayed when the `gameStatus` from `GET /game-engine/get-screen` is `WORD_AND_SPY_REVEAL`.
- **UI**:
    - **Common Elements**: A prominent "Continue" button to proceed to the next player's turn or the next game phase.
    - **Screen Type: `PASS_DEVICE`**:
        - Displays a clear instruction like "Pass the device to [Player Name]" (from `data.displayText`).
        - Visually represent a player (e.g., an avatar or icon, potentially with a placeholder image).
        - The "Continue" button should be clearly visible.
    - **Screen Type: `ROLE_REVEAL`**:
        - Displays the player's role (e.g., "You are NOT a SPY" or "You are SPY") prominently (from `data.displayText`).
        - Displays the player's name (from `data.playerDetails.playerName`).
        - **For Non-Spies (`data.playerDetails.isSpy: false`)**:
            - Displays the `data.categoryName`.
            - Displays the `data.wordName`.
            - Displays the `data.roleDescriptionText` (if provided and relevant).
        - **For Spies (`data.playerDetails.isSpy: true`)**:
            - Displays the `data.categoryName`.
            - Displays the `data.roleDescriptionText` (if provided and relevant, e.g., a specific spy instruction).
            - The `data.wordName` **must not** be displayed.
        - The "Continue" button should be clearly visible.
- **API Endpoint**: `GET http://localhost:8080/game-engine/role-reveal`  *(this is a GET, called once per screen)*
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK)**:
        - **Response Type 1: `PASS_DEVICE`**: The payload is in the `data` object.
            ```json
            { // Example response for PASS_DEVICE screen
                "message": "Role reveal screen loaded successfully",
                "data": {
                    "categoryName": "test1",
                    "displayText": "Pass the device to Sayam",
                    "isLast": false,
                    "playerDetails": {
                        "isSpy": null,
                        "playerName": "Sayam",
                        "playerNumber": 1
                    },
                    "roleDescriptionText": null,
                    "screenType": "PASS_DEVICE",
                    "wordName": "test2"
                },
                "status": "200 OK"
            }
            ```
            *   Frontend should display the `data.displayText` and wait for user interaction (e.g., clicking "Continue").
        - **Response Type 2: `ROLE_REVEAL` (Non-Spy)**: The payload is in the `data` object.
            ```json
            { // Example response for ROLE_REVEAL (Non-Spy) screen
                "message": "Role reveal screen loaded successfully",
                "data": {
                    "categoryName": "test1",
                    "displayText": "You are NOT a SPY",
                    "isLast": false,
                    "playerDetails": {
                        "isSpy": false,
                        "playerName": "Sayam",
                        "playerNumber": 1
                    },
                    "roleDescriptionText": null,
                    "screenType": "ROLE_REVEAL",
                    "wordName": "test2"
                },
                "status": "200 OK"
            }
            ```
            *   Frontend displays the role (`data.displayText`), player name (`data.playerDetails.playerName`), category (`data.categoryName`), and word (`data.wordName`).
        - **Response Type 3: `ROLE_REVEAL` (Spy)**: The payload is in the `data` object.
            ```json
            { // Example response for ROLE_REVEAL (Spy) screen
                "message": "Role reveal screen loaded successfully",
                "data": {
                    "categoryName": "test1",
                    "displayText": "You are SPY",
                    "isLast": false,
                    "playerDetails": {
                        "isSpy": true,
                        "playerName": "Sunny",
                        "playerNumber": 2
                    },
                    "roleDescriptionText": null,
                    "screenType": "ROLE_REVEAL",
                    "wordName": "test2" // Frontend must hide this for spies
                },
                "status": "200 OK"
            }
            ```
            *   Frontend displays the role (`data.displayText`) and player name (`data.playerDetails.playerName`). It **must hide** the `data.wordName` for spies.
    - **Logic**:
        - The frontend will repeatedly call this API until `data.isLast` is `true`.
        - Once `data.isLast` is `true`, the frontend should then call `GET /game-engine/get-screen` to transition to the next game phase (expected to be `DISCUSSION_TIME`).
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Display "Invalid game state for role reveal."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.

#### 3.2.9. Discussion Time Screen (`DISCUSSION_TIME`)
- **Description**: This screen is for the discussion phase of the game. A timer is displayed, and players discuss to find the spy. This screen is displayed when the `gameStatus` from `GET /game-engine/get-screen` is `DISCUSSION_TIME`.
- **UI**:
    - A clear title: "Discussion Time".
    - A prominent countdown timer.
    - A list of players, possibly with their status (e.g., "In Game").
- **Logic**:
    - When this screen loads, the frontend receives `discussionStartTime` from the `data` object in the `GET /game-engine/get-screen` API response.
    - The frontend also needs to fetch the `discussion_duration` from the `GET /config/get` endpoint.
    - The countdown timer's end time is calculated as `discussionStartTime + (discussion_duration * 1000)`.
    - The timer should display the remaining time by calculating the difference between the end time and the current time.
    - Once the timer reaches zero, the frontend should start polling the `GET /game-engine/get-screen` API every 1 second.
    - Polling continues until the `gameStatus` changes, expecting to transition to the `VOTING` screen.
- **API Endpoint (`get-screen`)**: `GET http://localhost:8080/game-engine/get-screen`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK) with `DISCUSSION_TIME` status**:
        ```json
        {
            "data": {
                "discussionStartTime": 1772825506080
            },
            "gameStatus": "DISCUSSION_TIME",
            "message": "Game Status loaded successfully",
            "status": "200 OK"
        }
        ```
    - **Error Handling**: Standard error handling applies as with other `get-screen` calls.
- **API Endpoint (Configuration)**: `GET http://localhost:8080/config/get`
    - **Logic**: Fetch the configuration with `key: "discussion_duration"` to calculate the timer.

#### 3.2.10. Voting Screen (`VOTING`)
- **Description**: This screen allows players to vote for who they believe is the spy. The screen updates for each player's turn until all votes are cast. This screen is displayed when the `gameStatus` from `GET /game-engine/get-screen` is `VOTING`.
- **UI**:
    - A clear header, e.g., "Voting Time" (from `data.displayTextHeader`).
    - An instruction for the current player, e.g., "Sayam, choose one player who you think is the spy" (constructed from `data.currentPlayerName` and `data.displayText`).
    - A list or grid of player cards from `data.votingList`.
    - Each player card should be selectable and display the `playerName`.
    - A "Submit Vote" button, which becomes active after a player is selected.
- **Logic**:
    - When the `gameStatus` is `VOTING`, the frontend's first action is to call `GET /game-engine/voting` to get the data for the current voter.
    - The UI is rendered based on the response. The `votingList` excludes the `currentPlayerName` **and any players eliminated in previous rounds** (they cannot be voted for and do not vote).
    - When the user selects a player and clicks "Submit Vote", the frontend calls `POST /game-engine/vote` with the selected `player_id`.
    - After a successful vote, the frontend immediately calls `GET /game-engine/voting` again to get the data for the next player's turn.
    - This cycle continues. The `data.isLast` flag in the `GET /game-engine/voting` response indicates if the current vote is the final one.
    - If `isLast` was `true` for the current turn, after that player votes the round is resolved. The frontend must call `GET /game-engine/get-screen` to find the next state, which will be one of `REVOTE`, `SPY_GUESS`, `ROUND_END`, or `SCORING` — see **3.2.11 Round Outcome & Multi-Round Flow**.
- **API Endpoint (Get Voting Screen Data)**: `GET http://localhost:8080/game-engine/voting`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK)**:
        ```json
        {
            "data": {
                "currentPlayerName": "Sayam",
                "displayText": "Choose one player who you think is the spy",
                "displayTextHeader": "Voting Time",
                "isLast": false,
                "votingList": [
                    { "playerId": 2, "playerName": "Sunny" },
                    { "playerId": 3, "playerName": "Sarah" }
                ]
            },
            "message": "Voting Screen fetched successfully",
            "status": "200 OK"
        }
        ```
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Display "Invalid game state for voting."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.
- **API Endpoint (Cast Vote)**: `POST http://localhost:8080/game-engine/vote?player_id=<selected_player_id>`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK)**:
        ```json
        {
            "data": null,
            "message": "Vote cast successfully",
            "status": "200 OK"
        }
        ```
        *   After this response, the frontend proceeds with the logic described above (either call `/game-engine/voting` again or `/game-engine/get-screen`).
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Display "Invalid game state for voting."
    - **Error (400 BAD_REQUEST - INVALID_VOTE)**: Display "You cannot vote for this player." or "It's not your turn to vote."
    - **Error (404 NOT_FOUND - PLAYER_NOT_FOUND)**: Display "The player you voted for does not exist."
    - **Error (500 INTERNAL_SERVER_ERROR)**: Trigger the global "Internal Server Error" pop-up.



#### 3.2.11 Round Outcome & Multi-Round Flow

Once every **active** player has cast a vote (see 3.2.10), the backend tallies the votes and moves the game to one of several states. The frontend detects the new state by calling `GET /game-engine/get-screen` after the final vote of the round.

- The most-voted player is the "accused".
- **Tie** (two or more players share the highest vote count) → `gameStatus` = `REVOTE`. The frontend re-runs the voting flow for the same active players (call `GET /game-engine/voting` again and continue as in 3.2.10). Voting and voting-submission endpoints accept both `VOTING` and `REVOTE`.
- **Accused is an innocent** → they are eliminated. If enough players remain the game continues to another round (`ROUND_END`, see 3.2.13); if too few remain the spies win (`SCORING`, see 3.2.14).
- **Accused is a spy** → `gameStatus` = `SPY_GUESS` (see 3.2.12): the caught spy decides whether to guess the word.

Rules the frontend should be aware of:
- **Eliminated players are excluded from every later round** — they neither vote nor appear in any `votingList`.
- The game supports **1 or 2 spies** (chosen on the Game Option screen).
- A round "continues" only while the number of remaining active players is above a server-configured minimum. When it drops to/below that minimum with a spy still hidden, the spies win.

#### 3.2.12 Spy Guess Screen (`SPY_GUESS`)
- **Description**: Shown when a spy has been voted out. The caught spy chooses to either **guess the secret word** (the spy team wins if correct) or **decline**. This screen is displayed when `gameStatus` is `SPY_GUESS`.
- **UI**:
    - Display the caught spy's name (`data.caughtSpyName`) and the `data.categoryName`.
    - A text input for the word guess and a "Guess" button.
    - A "Decline" button.
    - **The secret word must NOT be shown on this screen.**
- **API Endpoint (`get-screen`)**: `GET http://localhost:8080/game-engine/get-screen`
    - **Success (200 OK) with `SPY_GUESS`**:
        ```json
        {
            "data": { "caughtSpyName": "Sunny", "categoryName": "Movies", "roundNumber": 2 },
            "gameStatus": "SPY_GUESS",
            "message": "Game Status loaded successfully",
            "status": "200 OK"
        }
        ```
- **API Endpoint (Guess the word)**: `POST http://localhost:8080/game-engine/spy-guess`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Request Body**: `{ "word": "Inception" }`
    - **Success (200 OK)**: The game moves to `SCORING`. A **correct** guess means the spies win; a **wrong** guess means the innocents win. After the response, call `GET /game-engine/get-screen` (expected `SCORING`).
    - **Error (400 BAD_REQUEST)**: Word is blank/invalid, or the game is not in a state that allows guessing.
- **API Endpoint (Decline to guess)**: `POST http://localhost:8080/game-engine/spy-decline`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK)**: The caught spy is eliminated. If they were the **last** spy, the innocents win → `SCORING`. Otherwise the round continues → `ROUND_END` (or `SCORING` if too few players remain). After the response, call `GET /game-engine/get-screen`.
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Only valid at `SPY_GUESS`.
- **Voluntary guess**: `POST /game-engine/spy-guess` is also accepted during `DISCUSSION_TIME`, `VOTING`, and `REVOTE`, allowing a spy to proactively guess the word at any point in a round (same win/lose outcome).

#### 3.2.13 Round End Screen (`ROUND_END`)
- **Description**: An interstitial shown after an innocent is voted out (or a caught spy declines) and the game continues. It announces who was eliminated, then proceeds to the next round. Displayed when `gameStatus` is `ROUND_END`.
- **UI**:
    - Display "<`data.eliminatedPlayerName`> was voted out" and (optionally) the round number.
    - A prominent "Continue" button.
- **API Endpoint (`get-screen`)**: `GET http://localhost:8080/game-engine/get-screen`
    - **Success (200 OK) with `ROUND_END`**:
        ```json
        {
            "data": { "eliminatedPlayerName": "Aarib", "roundNumber": 2 },
            "gameStatus": "ROUND_END",
            "message": "Game Status loaded successfully",
            "status": "200 OK"
        }
        ```
- **API Endpoint (Start next round)**: `POST http://localhost:8080/game-engine/next-round`
    - **Request Headers**: `Authorization: Bearer <token>`
    - **Success (200 OK)**: Starts the next round — the game returns to `DISCUSSION_TIME` (a fresh discussion timer starts), then transitions to `VOTING` exactly as in 3.2.9–3.2.10. After the response, call `GET /game-engine/get-screen`.
    - **Error (400 BAD_REQUEST - INVALID_GAME_STATUS)**: Only valid at `ROUND_END`.

#### 3.2.14 Scoring / Result Screen (`SCORING`)
- **Description**: The final screen, shown when the game is over. It reveals the outcome, the spies, the word, and every player's score. Displayed when `gameStatus` is `SCORING`.
- **UI**:
    - Prominently show who won (`data.winner`: `SPY` or `INNOCENT`).
    - Reveal the `data.spies` (names) and the secret `data.word`.
    - Render `data.scores` as a leaderboard (e.g., sorted by `score` descending).
    - A "New Game" button.
- **API Endpoint (`get-screen`)**: `GET http://localhost:8080/game-engine/get-screen`
    - **Success (200 OK) with `SCORING`**:
        ```json
        {
            "data": {
                "winner": "SPY",
                "word": "Inception",
                "spies": ["Sunny"],
                "roundNumber": 3,
                "scores": [
                    { "playerNumber": 1, "playerName": "Sayam", "score": -2 },
                    { "playerNumber": 2, "playerName": "Sunny", "score": 6 },
                    { "playerNumber": 3, "playerName": "Sarah", "score": -2 }
                ]
            },
            "gameStatus": "SCORING",
            "message": "Game Status loaded successfully",
            "status": "200 OK"
        }
        ```
- **New Game**: `POST http://localhost:8080/game-engine/reset`, then `GET /game-engine/get-screen` (expected `CATEGORY_SELECTION`).
- **Scoring rules (context for the UI)**: for every round the spies survive, each spy gains points and each innocent loses points; the winning side receives a bonus at the end. All point values are configured server-side (see 3.2.15), so the frontend should render whatever `scores` are returned rather than assuming fixed numbers.

#### 3.2.15 Scoring Configuration (server-side)
- The tunable scoring rules live in a single `app_config` row, `key: "scoring_config"`, whose value is a JSON object:
    ```json
    {
        "minPlayersToContinue": 3,
        "spyPointsPerRound": 1,
        "innocentPointsPerRound": 1,
        "spyWinBonus": 2,
        "innocentWinBonus": 2
    }
    ```
- These are applied by the backend; the frontend does not need to read them, but they explain the numbers shown on the Scoring screen.

## 4. Non-Functional Requirements

### 4.1. Performance
- The application should be highly responsive, with fast loading times and smooth UI transitions.
- All API calls should be asynchronous to prevent UI blocking.

### 4.2. Security
- **JWT Handling**: The JWT token received upon login/registration must be securely stored client-side (e.g., `localStorage` for convenience, but `HttpOnly` cookies are more secure for production environments). The frontend will be responsible for extracting the `userId` from the JWT token.
- **Authorization Header**: All authenticated API requests must include the `Authorization: Bearer <token>` header. This is the **only** header the backend needs for identity — it extracts the `userId` and `role` from the token itself. (There is no `X-User-Id` header; do not send one.)
- **Role-Based Access Control**: The frontend may extract the user's `role` from the JWT to conditionally render UI elements or restrict access to certain routes (e.g., for ADMIN screens). The backend independently enforces roles on admin endpoints (403 on violation).

### 4.3. Error Handling
- **Consistent response envelope**: **Every** backend response — success or error — is a JSON object with `status` (e.g. `"400 BAD_REQUEST"`), `message` (a human-readable string), and, on success, `data`. The frontend can display `message` directly for most errors and branch on `status`.
- **Specific Error Messages**: For known API error codes, display user-friendly messages as detailed in the functional requirements. Status codes the backend uses:
    - `400 BAD_REQUEST` — validation failure (missing/invalid fields; the `message` names the failing field), malformed JSON body, or an action attempted in the wrong game state (`INVALID_GAME_STATUS`).
    - `401 UNAUTHORIZED` — missing/invalid/expired token (also returned as the envelope). Redirect to login.
    - `403 FORBIDDEN` — authenticated but not allowed (e.g. a non-admin calling an admin endpoint).
    - `404 NOT_FOUND` — entity does not exist.
    - `409 CONFLICT` — a duplicate (e.g. user/category/group already exists) or a concurrent-modification conflict (two overlapping writes to the same game — safe to retry the last action).
- **Generic 500 Error**: Any `500 Internal Server Error` should trigger a small, non-blocking toast with a red background displaying "Internal Server Error". Dismissible or auto-hide after a few seconds.
- **Network Errors**: Handle network connectivity issues gracefully (e.g., "No internet connection").

## 5. Technical Considerations

### 5.1. Frontend Framework/Library
- A modern, component-based JavaScript framework (e.g., React, Vue.js, Angular) is recommended for building the UI. For this project, **React** is the chosen framework.

### 5.2. State Management
- A robust state management solution (e.g., Redux, Vuex, Zustand, React Context API with `useReducer`) should be used to manage application-wide state, including authentication status, user data, and game progress.

### 5.3. API Integration
- Use a library like Axios for making HTTP requests.
- Implement a request interceptor to automatically attach the `Authorization: Bearer <token>` header to authenticated requests.
- Implement response interceptors to handle global error conditions (e.g., 401 unauthorized, 500 internal server error) and potentially refresh tokens if applicable.

### 5.4. Routing
- Implement client-side routing to manage navigation between different application views (e.g., `/login`, `/register`, `/game`, `/game/category-selection`).

## 6. Future Considerations (ADMIN Screen)
- The frontend architecture should be designed to easily accommodate an ADMIN screen in the future. This implies:
    - **Role-Based Access Control (RBAC)**: Implement logic to conditionally render UI elements or restrict access to certain routes based on the user's role (e.g., 'USER' vs. 'ADMIN'), which can be extracted from the JWT token.
    - **Modular Design**: Keep admin-specific components and logic separate from user-facing components.

## 7. Backend API Endpoints (Summary for Frontend Reference)

### Authentication
- `POST http://localhost:8080/auth/register`: User registration.
- `POST http://localhost:8080/auth/login`: User login.
- Logout: client-side only (discard the token) — no backend endpoint.

### Game Engine
- `POST http://localhost:8080/game-engine/reset`: Resets the current game for the user.
- `GET http://localhost:8080/game-engine/get-screen`: Retrieves the current game screen/status for the user.
- `GET http://localhost:8080/game-engine/role-reveal`: Advances the role reveal process for each player (call once per screen until `data.isLast` is true).
- `POST http://localhost:8080/game-engine/game-option`: Sets game options like the number of spies (`number_of_spy`, 1 or 2).
- `GET http://localhost:8080/game-engine/voting`: Retrieves the current voter's voting screen (valid at `VOTING`/`REVOTE`).
- `POST http://localhost:8080/game-engine/vote?player_id={n}`: Casts a vote for player number `n`.
- `POST http://localhost:8080/game-engine/next-round`: Advances from `ROUND_END` into the next round.
- `POST http://localhost:8080/game-engine/spy-guess`: A spy guesses the word (`{ "word": "..." }`).
- `POST http://localhost:8080/game-engine/spy-decline`: A caught spy declines to guess.

### Group Management
- `GET http://localhost:8080/group/get`: Retrieves all available groups or a specific group.
- `POST http://localhost:8080/group/create`: Creates a new group.
- `PUT http://localhost:8080/group/get?groupId={id}`: Updates an existing group.
- `POST http://localhost:8080/group/select`: Selects a group for the current game.

### Category Management
- `GET http://localhost:8080/category/get`: Retrieves all available categories.
- `POST http://localhost:8080/category/select`: Selects a category for the current game.

### Configuration
- `GET http://localhost:8080/config/get`: Retrieves application configurations (e.g., player limits, spy limits, group limits).

---

## Backend Enhancements Needed for Current Scope

The following captures the current backend status — what is already available, and what is still pending — for frontend integration:

1.  **`GET /game-engine/get-screen` Endpoint** — ✅ **Implemented.** Returns the current `gameStatus` plus state-specific data in `data` (see the per-screen sections above, including the new `SPY_GUESS`/`ROUND_END`/`SCORING` payloads). The `userId` is derived from the JWT by the backend.

2.  **`PUT /group/get?groupId={id}` Endpoint Implementation** — ⚠️ **Still pending** (not yet implemented on the backend):
    - **Necessity**: The frontend requires an API to update group details (name, players). The prompt states this is not yet integrated but will be in this version.
    - **Recommendation**: Implement the `PUT /group/get?groupId={id}` endpoint in the backend to handle updating group information. This would likely involve a new method in `GroupService` that takes a `groupId` and a `GroupRequest` (or a similar DTO) to update the corresponding `Group` entity.
    - **Note**: The `userId` for this endpoint should be extracted from the JWT token by the backend.

3.  **Configuration for Game Logic** — mostly ✅ available via `GET http://localhost:8080/config/get`. Keys:
        - `min_player_allowed_in_group`: Minimum number of players allowed in a group.
        - `max_player_allowed_in_group`: Maximum number of players allowed in a group.
        - `max_group_allowed`: Maximum number of groups a user can create. *(pending — not yet seeded)*
        - `min_spy_allowed` / `max_spy_allowed`: Spy count bounds. Note the game logic supports **1 or 2 spies** — cap the Game Option UI at 2.
        - `discussion_duration`: Duration for the discussion phase in seconds.
        - `scoring_config`: A JSON string with the scoring rules — see **3.2.15** (the frontend does not need to read this; it's applied server-side).

4.  **`roleDescriptionText` for Spies**:
    - **Necessity**: The current `ROLE_REVEAL` response for spies has `roleDescriptionText: null`. To provide a richer experience, especially for future features like a "spy word," this field should be populated.
    - **Recommendation**: The backend should populate `screenData.roleDescriptionText` for spies with relevant instructions or a specific "spy word" if that feature is implemented.

5.  **`categoryName` for Spies**:
    - **Necessity**: The current `ROLE_REVEAL` response for spies includes `categoryName`. While not strictly problematic, in some game variations, the spy might not know the category.
    - **Recommendation**: Consider if `categoryName` should be `null` or empty for spies in the `ROLE_REVEAL` screenData, depending on the desired game mechanics. If the spy should know the category, it's fine as is. If not, the backend should adjust this.
