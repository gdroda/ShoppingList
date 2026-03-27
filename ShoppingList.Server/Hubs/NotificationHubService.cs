using Microsoft.AspNetCore.SignalR;

namespace ShoppingList.Server.Hubs
{
    public interface INotificationHubService
    {
        Task NewNotification(string userName, int listId);
    }
    public class NotificationHubService: Hub<INotificationHubService>
    {
        public async Task JoinNotificationGroup(int listId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"list_{listId}");
        }

        public async Task LeaveNotificationGroup(int listId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"list_{listId}");
        }

        public async Task NewNotification(string userName, int listId)
        {
            
        }
    }
}
