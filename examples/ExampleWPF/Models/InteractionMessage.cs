namespace ExampleWPF.Models;

public class InteractionMessage
{
    public int MessageId { get; }
    
    public string Message { get; }
    
    public InteractionMessage(string message, int messageId)
    {
        Message = message;
        MessageId = messageId;
    }
}