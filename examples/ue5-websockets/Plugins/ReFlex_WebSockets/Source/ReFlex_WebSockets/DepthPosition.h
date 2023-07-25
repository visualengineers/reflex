// Fill out your copyright notice in the Description page of Project Settings.

#pragma once

#include "CoreMinimal.h"
#include "FPosition.h"
#include "UObject/Object.h"
#include "DepthPosition.generated.h"

/**
 * 
 */
UCLASS(BlueprintType, Category="ReFlex|Data")
class REFLEX_WEBSOCKETS_API UDepthPosition : public UObject
{
	GENERATED_BODY()

public:
	
	UPROPERTY(BlueprintReadOnly, Category="ReFlex|Data")
	float X;

	UPROPERTY(BlueprintReadOnly, Category="ReFlex|Data")
	float Y;

	UPROPERTY(BlueprintReadOnly, Category="ReFlex|Data")
	float Z;

	UPROPERTY(BlueprintReadOnly, Category="ReFlex|Data")
	bool IsValid;

	UPROPERTY(BlueprintReadOnly, Category="ReFlex|Data")
	bool IsFiltered;

	void SetValues(FPosition position);
};
