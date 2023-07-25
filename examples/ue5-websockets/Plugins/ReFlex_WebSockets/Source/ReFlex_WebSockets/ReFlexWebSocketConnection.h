// Fill out your copyright notice in the Description page of Project Settings.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "IWebSocket.h"
#include "MessageSerializer.h"
#include "ReFlexWebSocketConnection.generated.h"

UCLASS()
class REFLEX_WEBSOCKETS_API AReFlexWebSocketConnection : public AActor
{
	GENERATED_BODY()
	
public:	
	// Sets default values for this actor's properties
	AReFlexWebSocketConnection();


private:
	TSharedPtr<IWebSocket> Socket;

	bool bIsConnected = false;

	// const FString ServerURL = TEXT("ws://127.0.0.1:8001/ReFlex");
	const FString ServerProtocol = TEXT("wss+insecure");

	bool SetupWebsocket();

	void DestroyWebsocket();

	void RemoveListeners();

	bool isConnected() const;


protected:
	// Called when the game starts or when spawned
	virtual void BeginPlay() override;

	// Called when the game starts or when spawned
	virtual void EndPlay(EEndPlayReason::Type EndPlayReason) override;

public:	
	// Called every frame
	virtual void Tick(float DeltaTime) override;

	UPROPERTY(BlueprintReadOnly, Category="ReFlex|Data")
	UMessageSerializer* Serializer;

	UPROPERTY(BlueprintReadOnly, Category="ReFlex|Websockets")
	bool IsConnected;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="ReFlex|Websockets")
	FString ServerURL = TEXT("ws://127.0.0.1:8001/ReFlex");

	UFUNCTION(BlueprintCallable, BlueprintNativeEvent, Category="ReFlex|Websockets")
	void ConnectionSuccessful();
	virtual void ConnectionSuccessful_Implementation();

	UFUNCTION(BlueprintCallable, BlueprintNativeEvent, Category="ReFlex|Websockets")
	void MessageReceived(const FString& Message);
	virtual void MessageReceived_Implementation(const FString& Message);

	UFUNCTION(BlueprintCallable, BlueprintNativeEvent, Category="ReFlex|Websockets")
	void ConnectionClosed(int32 StatusCode, const FString& Reason, bool bWasClean);
	virtual void ConnectionClosed_Implementation(int32 StatusCode, const FString& Reason, bool bWasClean);

	UFUNCTION(BlueprintCallable, BlueprintNativeEvent, Category="ReFlex|Websockets")
	void ConnectionError(const FString& Error);
	virtual void ConnectionError_Implementation(const FString& Error);

	UFUNCTION(BlueprintCallable, BlueprintNativeEvent, Category="ReFlex|Websockets")
	void RawMessage(const int32 Size, const int32 BytesRemaining);
	virtual void RawMessage_Implementation(const int32 Size, const int32 BytesRemaining);

	UFUNCTION(BlueprintCallable, BlueprintNativeEvent, Category="ReFlex|Websockets")
	void MessageSent(const FString& MessageString);
	virtual void MessageSent_Implementation(const FString& MessageString);

	UFUNCTION(BlueprintCallable, Category="ReFlex|Websockets")
	void ConnectToWebsocket();

	UFUNCTION(BlueprintCallable, Category="ReFlex|Websockets")
	void DisconnectFromWebsocket();
};
