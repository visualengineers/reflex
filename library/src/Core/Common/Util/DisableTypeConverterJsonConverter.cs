using System;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace ReFlex.Core.Common.Util
{
    public class DisableTypeConverterJsonConverter<T> : JsonConverter
    {
        static readonly IContractResolver resolver = new DisableTypeConverterContractResolver<T>();

        public override bool CanConvert(Type objectType)
        {
            return typeof(T).IsAssignableFrom(objectType);
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue,
            JsonSerializer serializer)
        {
            return JsonSerializer.CreateDefault(new JsonSerializerSettings {ContractResolver = resolver})
                .Deserialize(reader, objectType);
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            JsonSerializer.CreateDefault(new JsonSerializerSettings {ContractResolver = resolver})
                .Serialize(writer, value);
        }
    }

    public class DisableTypeConverterContractResolver<T> : CamelCasePropertyNamesContractResolver
    {
        protected override JsonContract CreateContract(Type objectType)
        {
            if (!typeof(T).IsAssignableFrom(objectType))
                return base.CreateContract(objectType);

            var contract = this.CreateObjectContract(objectType);
            contract.Converter = null; // Also null out the converter to prevent infinite recursion.
            return contract;
        }
    }
}