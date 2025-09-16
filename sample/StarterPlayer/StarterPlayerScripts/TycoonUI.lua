-- TycoonUI.lua

local Players = game:GetService('Players')
local PlayerDataRemote = require(game.ReplicatedStorage.Remotes.PlayerDataRemote)
local player = Players.LocalPlayer

local function updateUI(data)
    print('Money: ' .. data.money .. ', Tycoon Level: ' .. data.tycoonLevel)
end

PlayerDataRemote.OnClientEvent:Connect(updateUI)