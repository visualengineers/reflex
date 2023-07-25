#pragma once


#include "CoreMinimal.h"
#include "FExtremumDescription.h"
#include "UObject/Object.h"
#include "ExtremumDescriptionValue.generated.h"

UCLASS(BlueprintType, Category="ReFlex|Data")
class REFLEX_WEBSOCKETS_API UExtremumDescriptionValue : public UObject
{
	GENERATED_BODY()
	
public:

	
	UPROPERTY(BlueprintReadOnly, Category="ReFlex|Data")
	int Type;

	UPROPERTY(BlueprintReadOnly, Category="ReFlex|Data")
	int NumFittingPoints;

	UPROPERTY(BlueprintReadOnly, Category="ReFlex|Data")
	float PercentageFittingPoints;

	void SetValues(FExtremumDescription desc);
};
