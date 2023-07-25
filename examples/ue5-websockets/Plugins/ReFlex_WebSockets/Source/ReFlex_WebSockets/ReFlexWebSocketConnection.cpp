// Fill out your copyright notice in the Description page of Project Settings.


#include "ReFlexWebSocketConnection.h"

#include "WebSocketsModule.h"

// Sets default values
AReFlexWebSocketConnection::AReFlexWebSocketConnection()
{
    // Set this actor to call Tick() every frame.  You can turn this off to improve performance if you don't need it.
	PrimaryActorTick.bCanEverTick = true;

}

// Called when the game starts or when spawned
void AReFlexWebSocketConnection::BeginPlay()
{
	Super::BeginPlay();

    this->Serializer = NewObject<UMessageSerializer>();

    UE_LOG(LogTemp, Warning, TEXT("Created Serializer ?"));
}

// Called every frame
void AReFlexWebSocketConnection::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);

}

bool AReFlexWebSocketConnection::isConnected() const
{
    return this->Socket != nullptr && this->Socket.IsValid() && this->Socket->IsConnected();
}

void AReFlexWebSocketConnection::EndPlay(EEndPlayReason::Type EndPlayReason)
{
    Super::EndPlay(EndPlayReason);

    this->RemoveListeners();

    this->DestroyWebsocket();

    this->IsConnected = this->isConnected();   
}

/**
 * @brief default implementation of MessageReceived event. CAUTION: this is overriden when event is bound in Blueprint !
 * @param Message Message received from websocket
 */
void AReFlexWebSocketConnection::MessageReceived_Implementation(const FString& Message)
{
    UE_LOG(LogTemp, Warning, TEXT("WS: %s"), *Message);
}

/**
 * @brief default implementation of MessageSent event.
 * Occurs when socket is closed (both server or client-side)
 * CAUTION: this is overriden when event is bound in Blueprint !
 * @param StatusCode Status Code indicating whether the connection was closed normally or due to a server event.
 * @param Reason message explaining the status code
 * @param bWasClean whether socket was closed normally or due to an error.
 */
void AReFlexWebSocketConnection::ConnectionClosed_Implementation(int32 StatusCode, const FString& Reason, bool bWasClean)
{
    UE_LOG(LogTemp, Warning, TEXT("Connection to %s closed. StatusCode: %s. Reason: %s"), *this->ServerURL, *FString::FromInt(StatusCode), *Reason);
}

/**
 * @brief default implementation of ConnectionError event.
 * Occurs when socket throws an error
 * CAUTION: this is overriden when event is bound in Blueprint ! 
 * @param Error error message from socket / server.
 */
void AReFlexWebSocketConnection::ConnectionError_Implementation(const FString& Error)
{
    UE_LOG(LogTemp, Warning, TEXT("Connection error when connecting to %s. ErrorMessage: %s"), *this->ServerURL, *Error);
}

/**
 * @brief default implementation of ConnectionSuccessful event. Is Dispatched when connection has been established. CAUTION: this is overriden when event is bound in Blueprint !
 */
void AReFlexWebSocketConnection::ConnectionSuccessful_Implementation()
{
    UE_LOG(LogTemp, Display, TEXT("Connected to %s"), *this->ServerURL);
}

/**
 * @brief default implementation of RawMessage event. CAUTION: this is overriden when event is bound in Blueprint !
 * @param Size size of message body in bytes
 * @param BytesRemaining remaining size
 */
void AReFlexWebSocketConnection::RawMessage_Implementation(const int32 Size, const int32 BytesRemaining)
{
    UE_LOG(LogTemp, Display, TEXT("Raw Message Received from %s. Size: %s BytesRemaining: %s"), *this->ServerURL, *FString::FromInt(Size), *FString::FromInt(BytesRemaining));
}

/**
 * @brief default implementation of MessageSent event. CAUTION: this is overriden when event is bound in Blueprint !
 * @param MessageString message received fromn websocket
 */
void AReFlexWebSocketConnection::MessageSent_Implementation(const FString& MessageString)
{
    UE_LOG(LogTemp, Warning, TEXT("Received Message from %s. Message: %s"), *this->ServerURL, *MessageString);
}

void AReFlexWebSocketConnection::ConnectToWebsocket()
{
    if (this->isConnected())
    {
        this->DestroyWebsocket();
        this->IsConnected = this->isConnected();
    }
    
    if (this->Socket == nullptr)
    {
        const auto bResult = SetupWebsocket();
        if (!bResult)
        {
            UE_LOG(LogTemp, Error, TEXT("Cannot create Websocket for address: %s"), *this->ServerURL);
            return;
        }
            
    }

    this->Socket->Connect();
}

void AReFlexWebSocketConnection::DisconnectFromWebsocket()
{
    this->DestroyWebsocket();
    this->IsConnected = this->isConnected();
}


bool AReFlexWebSocketConnection::SetupWebsocket()
{
    UE_LOG(LogTemp, Warning, TEXT("Creating Websocket: %s"), *this->ServerURL);

    this->Socket = FWebSocketsModule::Get().CreateWebSocket(ServerURL, ServerProtocol);

    // We bind all available events
    this->Socket->OnConnected().AddLambda([this]() -> void {
        this->IsConnected = this->isConnected();
        this->ConnectionSuccessful();        
    });

    this->Socket->OnConnectionError().AddLambda([this](const FString& Error) -> void {
        // This code will run if the connection failed. Check Error to see what happened.
        this->IsConnected = this->isConnected();
        this->ConnectionError(Error); 
    });

    this->Socket->OnClosed().AddLambda([this](int32 StatusCode, const FString& Reason, bool bWasClean) -> void {
        // This code will run when the connection to the server has been terminated.
        // Because of an error or a call to Socket->Close().
        this->IsConnected = this->isConnected();
        this->ConnectionClosed(StatusCode, Reason, bWasClean);
        
        this->RemoveListeners();
    });

    this->Socket->OnMessage().AddLambda([this](const FString& Message) -> void {
        // This code will run when we receive a string message from the server.
        this->MessageReceived(Message);
    });

    this->Socket->OnRawMessage().AddLambda([this](const void* Data, SIZE_T Size, SIZE_T BytesRemaining) -> void {
        // This code will run when we receive a raw (binary) message from the server.
        this->RawMessage(Size, BytesRemaining);
    });

    this->Socket->OnMessageSent().AddLambda([this](const FString& MessageString) -> void {
        // This code is called after we sent a message to the server.
        this->MessageSent(MessageString);
    });

    return this->Socket != nullptr && this->Socket.IsValid();
}

void AReFlexWebSocketConnection::DestroyWebsocket()
{
    if (this->Socket != nullptr)
    {   
        this->Socket->Close();        
    }

    this->Socket = nullptr;
}

void AReFlexWebSocketConnection::RemoveListeners()
{
    if(this->Socket != nullptr)
    {
        this->Socket->OnMessage().Clear();
        this->Socket->OnConnected().Clear();
        this->Socket->OnConnectionError().Clear();
        this->Socket->OnRawMessage().Clear();
        this->Socket->OnMessageSent().Clear();
        this->Socket->OnClosed().Clear(); 
    }
}





