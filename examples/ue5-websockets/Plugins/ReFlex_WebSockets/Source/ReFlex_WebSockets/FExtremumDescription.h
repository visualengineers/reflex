#pragma once

#include "FExtremumDescription.generated.h"

USTRUCT()
struct REFLEX_WEBSOCKETS_API FExtremumDescription
{
	GENERATED_BODY()

	UPROPERTY()
	int Type;

	UPROPERTY()
	int NumFittingPoints;

	UPROPERTY()
	float PercentageFittingPoints;
};
