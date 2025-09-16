-- PlayerDataRemote.lua

local ReplicatedStorage = game:GetService('ReplicatedStorage')
local RemoteEvent = Instance.new('RemoteEvent')
RemoteEvent.Name = 'PlayerDataRemote'
RemoteEvent.Parent = ReplicatedStorage

return RemoteEvent