#pragma once

#include "FPosition.generated.h"

USTRUCT()
struct REFLEX_WEBSOCKETS_API FPosition
{
	GENERATED_BODY()

	UPROPERTY()
	float X;
	
	UPROPERTY()
	float Y;

	UPROPERTY()
	float Z;

	UPROPERTY()
	bool IsValid;

	UPROPERTY()
	bool IsFiltered;
};
