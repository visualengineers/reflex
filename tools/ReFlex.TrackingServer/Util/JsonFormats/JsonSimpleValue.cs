namespace TrackingServer.Util.JsonFormats
{
    public class JsonSimpleValue<T>
    {
      public string Name { get; set; } = "";

      public T Value { get; set; } = default!;

        public static bool ValidateArguments(JsonSimpleValue<T>? argument, string acceptedNameValue, string controllerMethod, out string errorMessage)
        {
            errorMessage = "";

            if (argument == null)
            {
                errorMessage = $"Error in {controllerMethod}(): Invalid parameter for {controllerMethod}: no argument provided or argument cannot be converted into {nameof(JsonSimpleValue<T>)}";
                return false;
            }

            if ( argument.Name != acceptedNameValue)
            {
                errorMessage = $"Error in {controllerMethod}(): Invalid parameter for {nameof(JsonSimpleValue<T>)}.{nameof(Name)}: Provided value is '{argument.Name}', Accepted value is '{acceptedNameValue}'.";
                return false;
            }

            if (argument.Value == null || string.IsNullOrEmpty(argument.Value.ToString()))
            {
                errorMessage = $"Error in {controllerMethod}(): Invalid or empty value for {acceptedNameValue}.";
                return false;
            }

            return true;

        }
    }
}
