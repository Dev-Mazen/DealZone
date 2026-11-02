using System.Collections;
using DealZone.Application;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace DealZone.UnitTests.DependencyInjection;

public class ApplicationServiceRegistrationTests
{
    private sealed class TestServiceCollection : IServiceCollection
    {
        private readonly List<ServiceDescriptor> _list = [];

        public int Count => _list.Count;
        public bool IsReadOnly => false;

        public ServiceDescriptor this[int index]
        {
            get => _list[index];
            set => _list[index] = value;
        }

        public void Add(ServiceDescriptor item) => _list.Add(item);
        public void Clear() => _list.Clear();
        public bool Contains(ServiceDescriptor item) => _list.Contains(item);
        public void CopyTo(ServiceDescriptor[] array, int arrayIndex) => _list.CopyTo(array, arrayIndex);
        public IEnumerator<ServiceDescriptor> GetEnumerator() => _list.GetEnumerator();
        public int IndexOf(ServiceDescriptor item) => _list.IndexOf(item);
        public void Insert(int index, ServiceDescriptor item) => _list.Insert(index, item);
        public bool Remove(ServiceDescriptor item) => _list.Remove(item);
        public void RemoveAt(int index) => _list.RemoveAt(index);
        IEnumerator IEnumerable.GetEnumerator() => _list.GetEnumerator();
    }

    [Fact]
    public void AddApplicationServices_ShouldReturnServiceCollection()
    {
        var services = new TestServiceCollection();

        var returnedServices = services.AddApplicationServices();

        Assert.Same(services, returnedServices);
    }
}
