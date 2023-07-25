#pragma once
#include "FExtremumDescription.h"
#include "FPosition.h"
#include "FInteraction.generated.h"

USTRUCT()
struct REFLEX_WEBSOCKETS_API FInteraction
{
	GENERATED_BODY()

	UPROPERTY()
	int32 TouchId;
	
	UPROPERTY()
	FPosition Position;	
	
	UPROPERTY()
	int32 Type;

	UPROPERTY()
	FExtremumDescription ExtremumDescription;

	UPROPERTY()
	float Confidence;

	UPROPERTY()
	int32 Time;
};
