// Copyright Epic Games, Inc. All Rights Reserved.

#include "ReFlex_WebSockets.h"
#include "Modules/ModuleManager.h"

#define LOCTEXT_NAMESPACE "FReFlex_WebSocketsModule"

void FReFlex_WebSocketsModule::StartupModule()
{
	// This code will execute after your module is loaded into memory; the exact timing is specified in the .uplugin file per-module
	if(!FModuleManager::Get().IsModuleLoaded("WebSockets"))
	{
		FModuleManager::Get().LoadModule("WebSockets");
	}
}

void FReFlex_WebSocketsModule::ShutdownModule()
{
	// This function may be called during shutdown to clean up your module.  For modules that support dynamic reloading,
	// we call this function before unloading the module.
}

#undef LOCTEXT_NAMESPACE
	
IMPLEMENT_MODULE(FReFlex_WebSocketsModule, ReFlex_WebSockets)