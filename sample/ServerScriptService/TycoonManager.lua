-- TycoonManager.lua

local Players = game:GetService('Players')
local PlayerDataRemote = require(game.ReplicatedStorage.Remotes.PlayerDataRemote)

local playerData = {}

local function onPlayerAdded(player)
    playerData[player.UserId] = { money = 0, tycoonLevel = 1 }
    PlayerDataRemote:FireClient(player, playerData[player.UserId])
end

local function onPlayerRemoving(player)
    playerData[player.UserId] = nil
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(onPlayerRemoving)