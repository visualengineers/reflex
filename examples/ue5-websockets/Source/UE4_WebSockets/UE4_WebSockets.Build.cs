// Copyright Epic Games, Inc. All Rights Reserved.

using UnrealBuildTool;

public class UE4_WebSockets : ModuleRules
{
	public UE4_WebSockets(ReadOnlyTargetRules Target) : base(Target)
	{
		PrivateDependencyModuleNames.AddRange(new string[] { "Json", "JsonUtilities" });
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(new string[] { "Core", "CoreUObject", "Engine", "InputCore", "WebSockets" });
	}
}
