#pragma once

#include "CoreMinimal.h"
#include "Modules/ModuleInterface.h"

class FWebSockets : public IModuleInterface
{
	virtual void StartupModule() override;
	virtual void ShutdownModule() override;

	virtual bool IsGameModule() const override
	{
		return true;
	}
};