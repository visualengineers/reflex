// Copyright Epic Games, Inc. All Rights Reserved.

using UnrealBuildTool;
using System.Collections.Generic;

public class UE4_WebSocketsEditorTarget : TargetRules
{
	public UE4_WebSocketsEditorTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Editor;
		DefaultBuildSettings = BuildSettingsVersion.V2;
		ExtraModuleNames.Add("UE4_WebSockets");
		WindowsPlatform.PCHMemoryAllocationFactor = 2000;
    IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
	}
}
