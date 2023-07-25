// Copyright Epic Games, Inc. All Rights Reserved.

using UnrealBuildTool;
using System.Collections.Generic;

public class UE4_WebSocketsTarget : TargetRules
{
	public UE4_WebSocketsTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		DefaultBuildSettings = BuildSettingsVersion.V2;
		ExtraModuleNames.Add("UE4_WebSockets");
		WindowsPlatform.PCHMemoryAllocationFactor = 2000;
	}
}
