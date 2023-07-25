#include "ExtremumDescriptionValue.h"

void UExtremumDescriptionValue::SetValues(FExtremumDescription desc)
{
	this->Type = desc.Type;
	this->NumFittingPoints = desc.NumFittingPoints;
	this->PercentageFittingPoints = desc.PercentageFittingPoints;
}

