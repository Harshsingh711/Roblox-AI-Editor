-- GameManager.lua
-- Manages game state and scoring

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")

local GameManager = {}
GameManager.__index = GameManager

-- Game state
local gameState = {
    isActive = false,
    startTime = 0,
    endTime = 0,
    players = {},
    score = 0
}

function GameManager.new()
    local self = setmetatable({}, GameManager)
    
    self:setupGame()
    return self
end

function GameManager:setupGame()
    -- Create scoring system
    self.score = 0
    
    -- Setup player management
    Players.PlayerAdded:Connect(function(player)
        self:addPlayer(player)
    end)
    
    Players.PlayerRemoving:Connect(function(player)
        self:removePlayer(player)
    end)
    
    -- Start the game
    self:startGame()
end

function GameManager:addPlayer(player)
    gameState.players[player.UserId] = {
        name = player.Name,
        score = 0,
        joinedTime = tick()
    }
    
    print(player.Name .. " joined the game!")
end

function GameManager:removePlayer(player)
    if gameState.players[player.UserId] then
        print(player.Name .. " left the game!")
        gameState.players[player.UserId] = nil
    end
end

function GameManager:startGame()
    gameState.isActive = true
    gameState.startTime = tick()
    
    print("Game started!")
    
    -- Start game loop
    spawn(function()
        while gameState.isActive do
            self:updateGame()
            wait(1) -- Update every second
        end
    end)
end

function GameManager:endGame()
    gameState.isActive = false
    gameState.endTime = tick()
    
    print("Game ended!")
    self:displayResults()
end

function GameManager:updateGame()
    if not gameState.isActive then return end
    
    -- Update game logic here
    self.score = self.score + 1
    
    -- Check win conditions
    if self.score >= 100 then
        self:endGame()
    end
end

function GameManager:addScore(player, points)
    if gameState.players[player.UserId] then
        gameState.players[player.UserId].score = gameState.players[player.UserId].score + points
        self.score = self.score + points
        
        print(player.Name .. " earned " .. points .. " points!")
    end
end

function GameManager:displayResults()
    print("=== GAME RESULTS ===")
    print("Total Score: " .. self.score)
    print("Game Duration: " .. math.floor(gameState.endTime - gameState.startTime) .. " seconds")
    
    -- Sort players by score
    local sortedPlayers = {}
    for userId, playerData in pairs(gameState.players) do
        table.insert(sortedPlayers, playerData)
    end
    
    table.sort(sortedPlayers, function(a, b)
        return a.score > b.score
    end)
    
    print("Player Rankings:")
    for i, playerData in ipairs(sortedPlayers) do
        print(i .. ". " .. playerData.name .. " - " .. playerData.score .. " points")
    end
end

function GameManager:getGameState()
    return gameState
end

function GameManager:resetGame()
    gameState = {
        isActive = false,
        startTime = 0,
        endTime = 0,
        players = {},
        score = 0
    }
    
    self.score = 0
    print("Game reset!")
end

-- Create global game manager instance
local gameManager = GameManager.new()

-- Export for other scripts
_G.GameManager = gameManager

return GameManager 