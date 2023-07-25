// YourModuleNameModule.cpp
#include "UE4_WebSockets.h"
#include "Modules/ModuleManager.h"

IMPLEMENT_PRIMARY_GAME_MODULE(FWebSockets, UE4_WebSockets, "ReFlex WebSockets");

void FWebSockets::StartupModule()
{
	// Put your module initialization code here

	if(!FModuleManager::Get().IsModuleLoaded("WebSockets"))
	{
		FModuleManager::Get().LoadModule("WebSockets");
	}
}

void FWebSockets::ShutdownModule()
{
	// Put your module termination code here
}