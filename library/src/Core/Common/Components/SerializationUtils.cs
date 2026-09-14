using System.IO;
using System.Xml;
using System.Xml.Serialization;
using Newtonsoft.Json;

namespace ReFlex.Core.Common.Components
{
    
    
    /// <summary>
    /// Helps to serialize or deserialize objects and files.
    /// </summary>
    public static class SerializationUtils
    {
        /// <summary>
        /// Serialize an object to json string
        /// </summary>
        /// <param name="data"> object to serialize </param>
        /// <returns> a json-string </returns>
        public static string SerializeToJson(object data) => JsonConvert.SerializeObject(data);

        /// <summary>
        /// try to deserialize a string from json to object with type T
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="json"></param>
        /// <returns> the deserialized object if the algorithm finished succesfully </returns>
        public static T DeserializeFromJson<T>(string json)
        {
            //try
            //{
                return JsonConvert.DeserializeObject<T>(json);
            //}
            // catch (Exception exc)
            // {
            //     
            //     return default(T);
            // }
        }

        /// <summary>
        /// Serializes the object.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="serializableObject">The serializable object.</param>
        /// <param name="fileStream">The file stream.</param>
        public static void SerializeObject<T>(T serializableObject, FileStream fileStream)
        {
            if (serializableObject == null) return;

            var xmlDocument = new XmlDocument();
            var serializer = new XmlSerializer(serializableObject.GetType());
            using (var memoryStream = new MemoryStream())
            {
                serializer.Serialize(memoryStream, serializableObject);
                memoryStream.Position = 0;
                xmlDocument.Load(memoryStream);
                xmlDocument.Save(fileStream);
                memoryStream.Close();
            }
        }

        /// <summary>
        /// Deserializes an xml file into an object list
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="fileStream"></param>
        /// <returns></returns>
        public static T DeserializeObject<T>(FileStream fileStream)
        {
            if (fileStream == null) return default(T);

            T objectOut;

            var xmlDocument = new XmlDocument();
            xmlDocument.Load(fileStream);
            var xmlString = xmlDocument.OuterXml;

            using (var read = new StringReader(xmlString))
            {
                var outType = typeof(T);

                var serializer = new XmlSerializer(outType);
                using (XmlReader reader = new XmlTextReader(read))
                {
                    objectOut = (T)serializer.Deserialize(reader);
                    reader.Close();
                }

                read.Close();
            }

            return objectOut;
        }

        /// <summary>
        /// Saves data to the file path.
        /// </summary>
        /// <param name="data">The data.</param>
        /// <param name="path">The path.</param>
        public static void SaveTo(string data, string path = @"c:\temp")
        {
            File.SetAttributes(path, FileAttributes.Normal);
            File.WriteAllText(path, data);
        }

        /// <summary>
        /// Loads data from the file path.
        /// </summary>
        /// <param name="path">The path.</param>
        /// <returns>
        /// The data as string.
        /// </returns>
        public static string LoadFrom(string path = @"c:\temp") => File.Exists(path) ? File.ReadAllText(path) : "";

    }
}
